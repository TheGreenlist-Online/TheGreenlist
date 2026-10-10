-- ---------------------------------------------------------------------------
-- Free-tier entitlements: new-thread cap, reply rate limits, AI query quota.
--
-- Spec: docs/entitlements-spec.md (v1). Commercial map: docs/commercial-schema-map.md.
--
-- Scope of this migration
--   * ONE plan exists: 'free'. No paid plan codes are seeded.
--   * NO commercial schema is created. public.current_plan() is the single
--     seam a future commercial migration replaces (body only).
--   * The database is the authority: route handlers call the RPCs below, and
--     BEFORE INSERT triggers re-check so direct inserts hit the same wall.
--   * Entitlements are never a trust signal: nothing here is readable through
--     public profile views, badges, reports, or search.
--
-- DRAFT: apply to a Supabase branch of the production Green List project and
-- run the acceptance list in the spec (section 9) before merging.
-- ---------------------------------------------------------------------------

-- 1. Participation gate (no DOB stored; only the fact and time of attestation)
alter table public.profiles
  add column if not exists age_attested_at timestamptz;

comment on column public.profiles.age_attested_at is
  'Set when the user attests they are of legal age for cannabis discussion. Required for forum writes and AI use. No date of birth is stored.';

-- 2. Config: plan limits (data, not code)
create table if not exists public.entitlement_limits (
  plan_code   text not null,
  limit_key   text not null,
  window_kind text not null
    check (window_kind in ('calendar_month', 'rolling_24h', 'rolling_1h', 'per_request')),
  max_value   integer not null check (max_value >= 0),
  notes       text,
  updated_at  timestamptz not null default now(),
  primary key (plan_code, limit_key)
);

comment on table public.entitlement_limits is
  'Per-plan ceilings for limited actions. Seeded with the free plan only. Tune from SQL; no deploy required.';

insert into public.entitlement_limits (plan_code, limit_key, window_kind, max_value, notes) values
  ('free', 'threads.new',             'calendar_month', 2,    'New forum threads per UTC calendar month.'),
  ('free', 'replies.hour',            'rolling_1h',     20,   'Replies per rolling hour.'),
  ('free', 'replies.day',             'rolling_24h',    100,  'Replies per rolling 24h.'),
  ('free', 'replies.day.new_account', 'rolling_24h',    10,   'Replies per rolling 24h while profile is under 72h old.'),
  ('free', 'ai.queries.month',        'calendar_month', 10,   'Accepted assistant requests per UTC calendar month.'),
  ('free', 'ai.queries.day',          'rolling_24h',    3,    'Accepted assistant requests per rolling 24h.'),
  ('free', 'ai.prompt.max_chars',     'per_request',    4000, 'Max prompt length.'),
  ('free', 'ai.output.max_tokens',    'per_request',    500,  'Max completion tokens.')
on conflict (plan_code, limit_key) do nothing;

-- 3. Human-issued corrections to usage (append-only, audited by actor)
create table if not exists public.entitlement_adjustments (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  limit_key  text not null,
  delta      integer not null,
  reason     text not null,
  actor_id   uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.entitlement_adjustments is
  'Admin credits (negative delta) or debits (positive delta) against a usage window. Never automatic.';

create index if not exists entitlement_adjustments_profile_idx
  on public.entitlement_adjustments (profile_id, limit_key, created_at desc);

-- 4. Metered AI usage (separate from ai_audit_logs so retention can differ)
create table if not exists public.ai_usage_events (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  model        text not null,
  prompt_chars integer not null check (prompt_chars >= 0),
  refunded     boolean not null default false,
  request_id   text
);

comment on table public.ai_usage_events is
  'One row per accepted POST /api/ai request. Inserted only via consume_ai_query(). refunded=true when the provider failed before streaming.';

create index if not exists ai_usage_events_profile_idx
  on public.ai_usage_events (profile_id, created_at desc);

-- 5. The seam. Today every profile is on the free plan.
create or replace function public.current_plan(p_profile uuid)
returns text
language sql stable security definer set search_path = '' as $$
  select 'free'::text;
$$;

comment on function public.current_plan(uuid) is
  'Resolves the plan code for a profile. Free-tier version returns ''free'' for everyone. A future commercial migration replaces the body only.';

-- 6. Window helper
create or replace function public.entitlement_window(p_kind text)
returns table (window_start timestamptz, window_end timestamptz)
language sql immutable set search_path = '' as $$
  select
    case p_kind
      when 'calendar_month' then date_trunc('month', now() at time zone 'utc') at time zone 'utc'
      when 'rolling_24h'    then now() - interval '24 hours'
      when 'rolling_1h'     then now() - interval '1 hour'
      else now()
    end,
    case p_kind
      when 'calendar_month' then (date_trunc('month', now() at time zone 'utc') + interval '1 month') at time zone 'utc'
      when 'rolling_24h'    then now() + interval '24 hours'
      when 'rolling_1h'     then now() + interval '1 hour'
      else now()
    end;
$$;

-- 7. Usage for one key inside its window
create or replace function public.entitlement_usage(p_profile uuid, p_key text)
returns table (used integer, max_value integer, window_kind text, window_start timestamptz, window_end timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_plan   text := public.current_plan(p_profile);
  v_limit  public.entitlement_limits%rowtype;
  v_start  timestamptz;
  v_end    timestamptz;
  v_count  integer := 0;
  v_adjust integer := 0;
begin
  select * into v_limit
    from public.entitlement_limits l
   where l.plan_code = v_plan and l.limit_key = p_key;

  if not found then
    -- Unknown key for this plan: treat as unlimited.
    return query select 0, 2147483647, 'none'::text, now(), now();
    return;
  end if;

  select w.window_start, w.window_end into v_start, v_end
    from public.entitlement_window(v_limit.window_kind) w;

  if p_key = 'threads.new' then
    select count(*)::int into v_count
      from public.forum_threads t
     where t.author_id = p_profile and t.created_at >= v_start;
  elsif p_key like 'replies.%' then
    select count(*)::int into v_count
      from public.forum_posts p
     where p.author_id = p_profile and p.created_at >= v_start;
  elsif p_key like 'ai.queries.%' then
    select count(*)::int into v_count
      from public.ai_usage_events e
     where e.profile_id = p_profile and e.created_at >= v_start and e.refunded = false;
  end if;

  select coalesce(sum(a.delta), 0)::int into v_adjust
    from public.entitlement_adjustments a
   where a.profile_id = p_profile and a.limit_key = p_key and a.created_at >= v_start;

  return query select greatest(v_count + v_adjust, 0), v_limit.max_value, v_limit.window_kind, v_start, v_end;
end;
$$;

-- 8. The check. Applies account status, age attestation, and role exemptions.
create or replace function public.check_entitlement(p_profile uuid, p_key text)
returns table (allowed boolean, used integer, max_value integer, resets_at timestamptz, reason text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_status   text;
  v_attested timestamptz;
  v_created  timestamptz;
  v_role     public.app_role;
  v_u        record;
  v_key      text := p_key;
  v_caller   uuid := auth.uid();
begin
  -- Entitlements are per-user state and are never a trust signal (see header).
  -- A logged-in caller may only inspect their OWN entitlements. Internal
  -- security-definer callers run with auth.uid() set to the acting user
  -- (triggers pass new.author_id = auth.uid(); consume_ai_query/my_entitlements
  -- pass auth.uid()). Service-role / migration callers have a null auth.uid()
  -- and are allowed through. This prevents one authenticated user from reading
  -- another profile's account status, age-attestation state, or usage counts.
  if v_caller is not null and p_profile is distinct from v_caller then
    return query select false, 0, 0, now(), 'forbidden'::text; return;
  end if;

  select p.account_status, p.age_attested_at, p.created_at
    into v_status, v_attested, v_created
    from public.profiles p where p.id = p_profile;

  if not found then
    return query select false, 0, 0, now(), 'profile_not_found'::text; return;
  end if;
  if coalesce(v_status, 'active') <> 'active' then
    return query select false, 0, 0, now(), 'account_restricted'::text; return;
  end if;
  if v_attested is null then
    return query select false, 0, 0, now(), 'age_attestation_required'::text; return;
  end if;

  v_role := public.platform_role(p_profile);

  -- Reviewers open procedural threads; they are exempt from the thread cap only.
  if p_key = 'threads.new' and v_role in ('MODERATOR', 'ADMIN') then
    return query select true, 0, 2147483647, now(), 'role_exempt'::text; return;
  end if;

  -- New accounts get the tighter daily reply limit for their first 72 hours.
  if p_key = 'replies.day' and v_created > now() - interval '72 hours' then
    v_key := 'replies.day.new_account';
  end if;

  select * into v_u from public.entitlement_usage(p_profile, v_key);

  return query
    select v_u.used < v_u.max_value, v_u.used, v_u.max_value, v_u.window_end,
           case when v_u.used < v_u.max_value then 'ok' else 'limit_reached' end;
end;
$$;

-- 9. Atomic AI consume: check both AI windows, then record the event.
create or replace function public.consume_ai_query(p_model text, p_prompt_chars integer, p_request_id text default null)
returns table (allowed boolean, used integer, max_value integer, resets_at timestamptz, reason text, limit_key text, event_id uuid)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_day   record;
  v_month record;
  v_id    uuid;
begin
  if v_uid is null then
    return query select false, 0, 0, now(), 'unauthenticated'::text, 'ai.queries.month'::text, null::uuid; return;
  end if;

  -- Serialize per profile so two concurrent requests cannot both pass.
  perform pg_advisory_xact_lock(hashtext('ai_quota:' || v_uid::text));

  select * into v_day   from public.check_entitlement(v_uid, 'ai.queries.day');
  if not v_day.allowed then
    return query select false, v_day.used, v_day.max_value, v_day.resets_at, v_day.reason, 'ai.queries.day'::text, null::uuid; return;
  end if;

  select * into v_month from public.check_entitlement(v_uid, 'ai.queries.month');
  if not v_month.allowed then
    return query select false, v_month.used, v_month.max_value, v_month.resets_at, v_month.reason, 'ai.queries.month'::text, null::uuid; return;
  end if;

  insert into public.ai_usage_events (profile_id, model, prompt_chars, request_id)
  values (v_uid, p_model, greatest(p_prompt_chars, 0), p_request_id)
  returning id into v_id;

  return query select true, v_month.used + 1, v_month.max_value, v_month.resets_at, 'ok'::text, 'ai.queries.month'::text, v_id;
end;
$$;

-- 10. Refund: only the owning profile, only within 10 minutes, only once.
create or replace function public.refund_ai_query(p_event_id uuid)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v_rows integer;
begin
  update public.ai_usage_events
     set refunded = true
   where id = p_event_id
     and profile_id = auth.uid()
     and refunded = false
     and created_at > now() - interval '10 minutes';
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

-- 11. UI convenience: everything for the signed-in user in one call.
create or replace function public.my_entitlements()
returns table (limit_key text, allowed boolean, used integer, max_value integer, resets_at timestamptz, reason text)
language sql stable security definer set search_path = '' as $$
  select k.key, c.allowed, c.used, c.max_value, c.resets_at, c.reason
    from unnest(array['threads.new', 'replies.hour', 'replies.day', 'ai.queries.month', 'ai.queries.day']) as k(key)
    cross join lateral public.check_entitlement(auth.uid(), k.key) c
   where auth.uid() is not null;
$$;

-- 12. Triggers: defense in depth against bypassed routes.
create or replace function public.forum_threads_enforce_entitlement()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  -- Service-role / owner inserts (migrations, imports) are not subject to the cap.
  if auth.uid() is null then return new; end if;

  -- Serialize per author so two concurrent inserts cannot both pass the cap.
  perform pg_advisory_xact_lock(hashtext('threads_quota:' || new.author_id::text));

  select * into v from public.check_entitlement(new.author_id, 'threads.new');
  if not v.allowed then
    raise exception 'entitlement_denied:threads.new:%', v.reason
      using errcode = 'P0001',
            hint = format('used=%s limit=%s resets_at=%s', v.used, v.max_value, v.resets_at);
  end if;
  return new;
end;
$$;

drop trigger if exists forum_threads_enforce_entitlement on public.forum_threads;
create trigger forum_threads_enforce_entitlement
  before insert on public.forum_threads
  for each row execute function public.forum_threads_enforce_entitlement();

create or replace function public.forum_posts_enforce_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  if auth.uid() is null then return new; end if;

  -- Serialize per author so two concurrent inserts cannot both pass the rate limit.
  perform pg_advisory_xact_lock(hashtext('replies_quota:' || new.author_id::text));

  select * into v from public.check_entitlement(new.author_id, 'replies.hour');
  if not v.allowed then
    raise exception 'entitlement_denied:replies.hour:%', v.reason
      using errcode = 'P0001',
            hint = format('used=%s limit=%s resets_at=%s', v.used, v.max_value, v.resets_at);
  end if;

  select * into v from public.check_entitlement(new.author_id, 'replies.day');
  if not v.allowed then
    raise exception 'entitlement_denied:replies.day:%', v.reason
      using errcode = 'P0001',
            hint = format('used=%s limit=%s resets_at=%s', v.used, v.max_value, v.resets_at);
  end if;
  return new;
end;
$$;

drop trigger if exists forum_posts_enforce_rate_limit on public.forum_posts;
create trigger forum_posts_enforce_rate_limit
  before insert on public.forum_posts
  for each row execute function public.forum_posts_enforce_rate_limit();

-- 13. Observability (admin only via RLS on the underlying tables + security_invoker)
create or replace view public.entitlement_usage_monthly
with (security_invoker = true) as
  with threads as (
    select author_id as profile_id, date_trunc('month', created_at at time zone 'utc') as month, count(*) as n
      from public.forum_threads group by 1, 2
  ), ai as (
    select profile_id, date_trunc('month', created_at at time zone 'utc') as month, count(*) as n
      from public.ai_usage_events where refunded = false group by 1, 2
  )
  select 'threads.new'::text as limit_key, t.month,
         count(*) as active_users,
         sum(t.n) as total_usage,
         count(*) filter (where t.n >= l.max_value) as users_at_cap,
         percentile_cont(0.5) within group (order by t.n) as p50,
         percentile_cont(0.95) within group (order by t.n) as p95
    from threads t
    join public.entitlement_limits l on l.plan_code = 'free' and l.limit_key = 'threads.new'
   group by t.month, l.max_value
  union all
  select 'ai.queries.month', a.month,
         count(*), sum(a.n),
         count(*) filter (where a.n >= l.max_value),
         percentile_cont(0.5) within group (order by a.n),
         percentile_cont(0.95) within group (order by a.n)
    from ai a
    join public.entitlement_limits l on l.plan_code = 'free' and l.limit_key = 'ai.queries.month'
   group by a.month, l.max_value;

-- 14. RLS and privileges (mirror the lock-down migration's posture)
alter table public.entitlement_limits      enable row level security;
alter table public.entitlement_adjustments enable row level security;
alter table public.ai_usage_events         enable row level security;

revoke all on public.entitlement_limits, public.entitlement_adjustments, public.ai_usage_events from anon, authenticated;

grant select on public.entitlement_limits to authenticated;
grant insert, update, delete on public.entitlement_limits to authenticated; -- gated by policy below
grant select, insert on public.entitlement_adjustments to authenticated;     -- gated by policy below
grant select on public.ai_usage_events to authenticated;                     -- inserts only via consume_ai_query()

drop policy if exists entitlement_limits_read on public.entitlement_limits;
create policy entitlement_limits_read on public.entitlement_limits
  for select to authenticated using (true);

drop policy if exists entitlement_limits_admin_write on public.entitlement_limits;
create policy entitlement_limits_admin_write on public.entitlement_limits
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists entitlement_adjustments_read on public.entitlement_adjustments;
create policy entitlement_adjustments_read on public.entitlement_adjustments
  for select to authenticated using (profile_id = (select auth.uid()) or public.is_reviewer());

drop policy if exists entitlement_adjustments_admin_insert on public.entitlement_adjustments;
create policy entitlement_adjustments_admin_insert on public.entitlement_adjustments
  for insert to authenticated with check (public.is_admin() and actor_id = (select auth.uid()));

drop policy if exists ai_usage_events_self_read on public.ai_usage_events;
create policy ai_usage_events_self_read on public.ai_usage_events
  for select to authenticated using (profile_id = (select auth.uid()) or public.is_admin());

grant execute on function public.my_entitlements() to authenticated;
grant execute on function public.consume_ai_query(text, integer, text) to authenticated;
grant execute on function public.refund_ai_query(uuid) to authenticated;
grant execute on function public.check_entitlement(uuid, text) to authenticated;
revoke execute on function public.current_plan(uuid) from public, anon;
revoke execute on function public.entitlement_usage(uuid, text) from public, anon, authenticated;

-- Users may set their own attestation exactly once; nothing else on profiles changes here.
-- (Profile update policies already exist; the column simply rides along with them.)
