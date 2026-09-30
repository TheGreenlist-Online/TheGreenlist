-- Unify the role system.
--
-- Before this migration there were three disagreeing sources of truth:
--
--   1. profiles.role   - free text, written by handle_new_user_profile, read by
--                        all application code, and by 5 RLS policies.
--   2. user_roles       - a separate table read by 6 RLS policies (evidence,
--                        moderation queue, moderation batches, reports) and by
--                        has_role(). No application code ever read or wrote it.
--                        It held 1 row for 3 users, so those 6 policies were
--                        effectively evaluating against an empty table.
--   3. role_permissions - a role -> permission table nothing read, using a
--                        dot-notation vocabulary while the app used its own
--                        colon-notation list in src/lib/roles.ts.
--
-- The app_role enum already existed with exactly the six roles the app knows,
-- but no column used it, so nothing validated role values anywhere.
--
-- After this migration:
--   * profiles.role is the single source of truth, typed as app_role.
--   * every role decision in SQL goes through the functions defined here.
--   * role_permissions is the single permission catalog, mirrored in
--     src/lib/roles.ts and diffed by scripts/check-role-sync.mjs.
--   * user_roles survives only as a self-scoped compatibility view over
--     profiles, so it can never drift again.
--
-- Two behaviour changes worth calling out, both fixing real inconsistencies:
--   * The 6 user_roles policies had no platform_owner override, so the platform
--     owner could not read evidence or the moderation queue while an ADMIN
--     could. The owner override is now applied uniformly.
--   * Those same policies were reading a near-empty table. Moderators and
--     admins identified by profiles.role now actually match. NDA scoping is
--     preserved exactly: a MODERATOR still needs a signed NDA at the right
--     scope, and only ADMIN/owner bypasses it.

-- ---------------------------------------------------------------------------
-- 1. Reconcile the two role stores before collapsing them.
-- ---------------------------------------------------------------------------

-- Rank authority so a disagreement resolves to the higher of the two rather
-- than to whichever table we happen to read second.
create or replace function public.role_rank(p_role text)
returns int language sql immutable set search_path = '' as $$
  select case upper(coalesce(p_role, ''))
    when 'ADMIN' then 60
    when 'MODERATOR' then 50
    when 'DISTRIBUTOR' then 40
    when 'CULTIVATOR' then 30
    when 'BUSINESS' then 20
    when 'USER' then 10
    else 0
  end;
$$;

-- private.protect_profile_authority() refuses any role change not made by the
-- platform owner, including one made by a migration (auth.uid() is null here).
-- It is suspended only for this reconciliation and restored immediately after.
alter table public.profiles disable trigger protect_profile_authority;

update public.profiles p
   set role = upper(trim(ur.role))
  from public.user_roles ur
 where ur.user_id = p.id
   and public.role_rank(ur.role) > public.role_rank(p.role);

-- Normalise case/whitespace, then force anything unrecognised to USER so the
-- enum cast below cannot fail.
update public.profiles set role = upper(trim(role)) where role is distinct from upper(trim(role));
update public.profiles
   set role = 'USER'
 where role is null
    or role not in ('USER', 'BUSINESS', 'DISTRIBUTOR', 'CULTIVATOR', 'MODERATOR', 'ADMIN');

alter table public.profiles enable trigger protect_profile_authority;

-- ---------------------------------------------------------------------------
-- 2. Drop every policy that reads either role store, so the column type can
--    change. All 11 are recreated in section 8.
-- ---------------------------------------------------------------------------

drop policy if exists ai_audit_logs_self_read on public.ai_audit_logs;
drop policy if exists audit_authority_read on public.audit_logs;
drop policy if exists role_permissions_authority_read on public.role_permissions;
drop policy if exists moderation_actions_authority_insert on public.user_moderation_actions;
drop policy if exists moderation_actions_authority_read on public.user_moderation_actions;
drop policy if exists evidence_moderator_read on public.evidence_files;
drop policy if exists batches_moderator_read on public.moderation_batches;
drop policy if exists batches_moderator_write on public.moderation_batches;
drop policy if exists queue_items_moderator_read on public.moderation_queue_items;
drop policy if exists queue_items_moderator_write on public.moderation_queue_items;
drop policy if exists reports_moderator_read on public.reports;

-- has_role and current_user_role are redefined against profiles below.
drop function if exists public.has_role(uuid, public.app_role);
drop function if exists public.current_user_role();

-- ---------------------------------------------------------------------------
-- 3. Retire the user_roles table. Its content was folded into profiles above.
-- ---------------------------------------------------------------------------

drop table if exists public.user_roles;

-- ---------------------------------------------------------------------------
-- 4. Make profiles.role the typed single source of truth.
-- ---------------------------------------------------------------------------

alter table public.profiles alter column role drop default;
alter table public.profiles
  alter column role type public.app_role using upper(trim(role))::public.app_role;
alter table public.profiles alter column role set default 'USER'::public.app_role;
alter table public.profiles alter column role set not null;

-- ---------------------------------------------------------------------------
-- 5. Role categories. Categories stay separate: a role belongs to exactly one,
--    and each category carries its own capabilities.
-- ---------------------------------------------------------------------------

create table if not exists public.role_catalog (
  role public.app_role primary key,
  category text not null check (category in ('COMMUNITY', 'OPERATOR', 'REVIEW')),
  label text not null,
  description text not null,
  sort_order int not null
);

delete from public.role_catalog;
insert into public.role_catalog (role, category, label, description, sort_order) values
  ('USER',        'COMMUNITY', 'Community member',
   'Files reports, posts in the forums, manages their own profile.', 10),
  ('BUSINESS',    'OPERATOR',  'Business',
   'Manages a claimed business listing and responds to reports about it.', 20),
  ('CULTIVATOR',  'OPERATOR',  'Cultivator',
   'Operator role for growers, with cultivation-specific tooling.', 30),
  ('DISTRIBUTOR', 'OPERATOR',  'Distributor',
   'Operator role for distribution, with supply-chain tooling.', 40),
  ('MODERATOR',   'REVIEW',    'Moderator',
   'Reviews the moderation queue and acts on community conduct. Private evidence requires a signed NDA scoped to the item.', 50),
  ('ADMIN',       'REVIEW',    'Administrator',
   'Full review authority plus platform operations, claim decisions and role management.', 60);

alter table public.role_catalog enable row level security;

drop policy if exists role_catalog_read on public.role_catalog;
create policy role_catalog_read on public.role_catalog
  for select to authenticated, anon using (true);

-- ---------------------------------------------------------------------------
-- 6. The permission catalog. This list is mirrored exactly in
--    src/lib/roles.ts and the two are diffed by scripts/check-role-sync.mjs.
--    Permissions are grouped by category and do not leak across categories:
--    business.manage means "manage my own listing" and is therefore an
--    OPERATOR permission that ADMIN does not hold. An admin acting on someone
--    else's business uses business.review instead.
-- ---------------------------------------------------------------------------

alter table public.role_permissions
  alter column role type public.app_role using upper(trim(role))::public.app_role;

create unique index if not exists role_permissions_role_permission_key
  on public.role_permissions (role, permission);

delete from public.role_permissions;

-- Community baseline: held by every role, including review and operator roles,
-- because everyone is also a member of the community.
insert into public.role_permissions (role, permission)
select r.role, p.permission
from unnest(array['USER','BUSINESS','CULTIVATOR','DISTRIBUTOR','MODERATOR','ADMIN']::public.app_role[]) as r(role)
cross join unnest(array['profile.read.self','report.create','forum.post']) as p(permission);

-- Operator category.
insert into public.role_permissions (role, permission)
select r.role, p.permission
from unnest(array['BUSINESS','CULTIVATOR','DISTRIBUTOR']::public.app_role[]) as r(role)
cross join unnest(array['business.manage','business.documents.submit']) as p(permission);

insert into public.role_permissions (role, permission) values
  ('CULTIVATOR', 'cultivation.manage'),
  ('DISTRIBUTOR', 'distribution.manage');

-- Review category. Moderator holds conduct powers; evidence.read.nda is the
-- right to reach private evidence at all, still NDA-gated per item by RLS.
insert into public.role_permissions (role, permission)
select r.role, p.permission
from unnest(array['MODERATOR','ADMIN']::public.app_role[]) as r(role)
cross join unnest(array[
  'moderation.review','moderation.warn','moderation.silence','moderation.restrict','evidence.read.nda'
]) as p(permission);

-- Administrator only.
insert into public.role_permissions (role, permission)
select 'ADMIN'::public.app_role, p.permission
from unnest(array[
  'report.review','business.review','users.read','users.manage_roles','audit.read','platform.admin'
]) as p(permission);

-- ---------------------------------------------------------------------------
-- 7. Canonical role functions. Every policy below calls these; no policy
--    reaches into a role table directly again.
--    SECURITY DEFINER so that evaluating a policy cannot recurse into the
--    RLS of the tables the role lives in.
-- ---------------------------------------------------------------------------

create or replace function public.platform_role(p_user uuid)
returns public.app_role language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = p_user limit 1;
$$;

create or replace function public.current_platform_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select public.platform_role(auth.uid());
$$;

-- Kept for compatibility with anything expecting the old text-returning name.
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = '' as $$
  select public.current_platform_role()::text;
$$;

-- Delegates to private.is_platform_owner, which reads auth.users directly.
-- The policies previously read auth.jwt() -> app_metadata -> platform_owner,
-- which is a snapshot from token issue time and goes stale until the user
-- refreshes their session. There is now one authoritative answer.
create or replace function public.is_platform_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_platform_owner(auth.uid());
$$;

create or replace function public.role_category(p_role public.app_role)
returns text language sql stable security definer set search_path = '' as $$
  select rc.category from public.role_catalog rc where rc.role = p_role;
$$;

create or replace function public.current_role_category()
returns text language sql stable security definer set search_path = '' as $$
  select public.role_category(public.current_platform_role());
$$;

create or replace function public.has_role(check_user_id uuid, check_role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.platform_role(check_user_id) = check_role;
$$;

create or replace function public.has_permission(p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_platform_owner() or exists (
    select 1
    from public.role_permissions rp
    where rp.role = public.current_platform_role()
      and rp.permission = p_permission
  );
$$;

-- Category predicates. The platform owner is treated as holding review
-- authority everywhere; that is the one deliberate cross-cutting override.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_platform_owner() or public.current_platform_role() = 'ADMIN';
$$;

create or replace function public.is_reviewer()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_platform_owner()
      or public.role_category(public.current_platform_role()) = 'REVIEW';
$$;

create or replace function public.is_operator()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.role_category(public.current_platform_role()) = 'OPERATOR';
$$;

-- ---------------------------------------------------------------------------
-- 8. user_roles as a compatibility view, scoped like the policy it replaces
--    (self-read, plus full visibility for review authority). Not
--    security_invoker: the filter here is the access rule.
-- ---------------------------------------------------------------------------

create view public.user_roles as
select p.id as user_id, p.role::text as role
from public.profiles p
where p.id = auth.uid() or public.is_admin();

comment on view public.user_roles is
  'Compatibility view over profiles.role, which is the single source of truth for roles. Formerly a separate table that no application code maintained. Do not write here; update profiles.role.';

grant select on public.user_roles to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Recreate all 11 policies against the canonical functions.
--    NDA scoping and every other condition is preserved verbatim; only the
--    role lookup changed, plus the owner override noted at the top.
-- ---------------------------------------------------------------------------

create policy ai_audit_logs_self_read on public.ai_audit_logs
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy audit_authority_read on public.audit_logs
  for select to authenticated
  using (public.has_permission('audit.read'));

create policy role_permissions_authority_read on public.role_permissions
  for select to authenticated
  using (public.is_reviewer());

create policy moderation_actions_authority_read on public.user_moderation_actions
  for select to authenticated
  using (public.is_reviewer());

create policy moderation_actions_authority_insert on public.user_moderation_actions
  for insert to authenticated
  with check (actor_id = (select auth.uid()) and public.is_reviewer());

create policy evidence_moderator_read on public.evidence_files
  for select to authenticated
  using (
    public.is_reviewer()
    and (
      public.is_admin()
      or exists (
        select 1 from public.nda_signatures ns
        where ns.moderator_user_id = (select auth.uid())
          and ns.scope = 'A_REPORT'
          and ns.report_id = evidence_files.report_id
          and ns.status = 'signed'
      )
    )
  );

create policy batches_moderator_read on public.moderation_batches
  for select to authenticated
  using (
    public.is_reviewer()
    and (
      public.is_admin()
      or exists (
        select 1 from public.nda_signatures ns
        where ns.moderator_user_id = (select auth.uid())
          and ns.scope = 'C_BATCH'
          and ns.batch_id = moderation_batches.id
          and ns.status = 'signed'
      )
    )
  );

create policy batches_moderator_write on public.moderation_batches
  for update to authenticated
  using (
    public.is_reviewer()
    and (
      public.is_admin()
      or exists (
        select 1 from public.nda_signatures ns
        where ns.moderator_user_id = (select auth.uid())
          and ns.scope = 'C_BATCH'
          and ns.batch_id = moderation_batches.id
          and ns.status = 'signed'
      )
    )
  )
  with check (
    public.is_reviewer()
    and (
      public.is_admin()
      or exists (
        select 1 from public.nda_signatures ns
        where ns.moderator_user_id = (select auth.uid())
          and ns.scope = 'C_BATCH'
          and ns.batch_id = moderation_batches.id
          and ns.status = 'signed'
      )
    )
  );

create policy queue_items_moderator_read on public.moderation_queue_items
  for select to authenticated
  using (
    public.is_reviewer()
    and (
      public.is_admin()
      or exists (
        select 1 from public.nda_signatures ns
        where ns.moderator_user_id = (select auth.uid())
          and ns.scope = 'B_QUEUE_ITEM'
          and ns.queue_item_id = moderation_queue_items.id
          and ns.status = 'signed'
      )
    )
  );

create policy queue_items_moderator_write on public.moderation_queue_items
  for update to authenticated
  using (
    public.is_reviewer()
    and (
      public.is_admin()
      or exists (
        select 1 from public.nda_signatures ns
        where ns.moderator_user_id = (select auth.uid())
          and ns.scope = 'B_QUEUE_ITEM'
          and ns.queue_item_id = moderation_queue_items.id
          and ns.status = 'signed'
      )
    )
  )
  with check (
    public.is_reviewer()
    and (
      public.is_admin()
      or exists (
        select 1 from public.nda_signatures ns
        where ns.moderator_user_id = (select auth.uid())
          and ns.scope = 'B_QUEUE_ITEM'
          and ns.queue_item_id = moderation_queue_items.id
          and ns.status = 'signed'
      )
    )
  );

create policy reports_moderator_read on public.reports
  for select to authenticated
  using (
    public.is_reviewer()
    and (
      public.is_admin()
      or exists (
        select 1 from public.nda_signatures ns
        where ns.moderator_user_id = (select auth.uid())
          and ns.scope = 'A_REPORT'
          and ns.report_id = reports.id
          and ns.status = 'signed'
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 10. Fold the private schema's own role helper into the same implementation.
--     private.is_platform_staff() answered the same question as
--     public.is_reviewer() with a separate hardcoded role list, which is
--     exactly the kind of second opinion this migration exists to remove.
--
--     Role assignment itself is deliberately left to the existing
--     private.protect_profile_authority() trigger on profiles: only the
--     platform owner may change a role, the owner must retain ADMIN, and every
--     change is written to audit_logs. That is stricter than anything added
--     here, so it stays as the sole gate.
-- ---------------------------------------------------------------------------

create or replace function private.is_platform_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_reviewer();
$$;

create index if not exists profiles_role_idx on public.profiles (role);
