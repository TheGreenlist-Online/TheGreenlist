-- Organization membership and verification foundation.
-- `business_profiles` remains the public organization record; these tables keep
-- private access and review data separate from the public directory.

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.business_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists organization_memberships_user_active_idx
  on public.organization_memberships (user_id, created_at desc) where status = 'active';
create index if not exists organization_memberships_organization_active_idx
  on public.organization_memberships (organization_id, created_at desc) where status = 'active';

-- Preserve existing ownership and automatically seed it for future claims.
insert into public.organization_memberships (organization_id, user_id, role, status, accepted_at)
select id, owner_id, 'owner', 'active', now()
from public.business_profiles
where owner_id is not null
on conflict (organization_id, user_id) do nothing;

create or replace function public.seed_organization_owner_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is not null then
    insert into public.organization_memberships (organization_id, user_id, role, status, accepted_at)
    values (new.id, new.owner_id, 'owner', 'active', now())
    on conflict (organization_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.seed_organization_owner_membership() from public;
drop trigger if exists trg_seed_organization_owner_membership on public.business_profiles;
create trigger trg_seed_organization_owner_membership after insert on public.business_profiles
for each row execute function public.seed_organization_owner_membership();

-- This helper avoids recursive RLS. Original record owners and active owner/
-- admin members are the only people who can manage an organization's members.
create or replace function public.can_manage_organization_members(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_profiles b
    where b.id = p_organization_id and b.owner_id = auth.uid()
  ) or exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id and m.user_id = auth.uid()
      and m.status = 'active' and m.role in ('owner', 'admin')
  );
$$;
revoke all on function public.can_manage_organization_members(uuid) from public;
grant execute on function public.can_manage_organization_members(uuid) to authenticated;

alter table public.organization_memberships enable row level security;
create policy organization_memberships_read on public.organization_memberships
for select to authenticated using (
  user_id = (select auth.uid()) or public.can_manage_organization_members(organization_id)
);
-- Owner rows are seeded only by the database. An admin cannot change an
-- identity or move a membership to another organization via UPDATE.
create policy organization_memberships_insert on public.organization_memberships
for insert to authenticated with check (
  public.can_manage_organization_members(organization_id) and role <> 'owner'
);
create policy organization_memberships_update on public.organization_memberships
for update to authenticated using (
  public.can_manage_organization_members(organization_id) and role <> 'owner'
) with check (public.can_manage_organization_members(organization_id) and role <> 'owner');
create policy organization_memberships_delete on public.organization_memberships
for delete to authenticated using (
  public.can_manage_organization_members(organization_id) and role <> 'owner'
);

create or replace function public.guard_organization_membership_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id
     or new.organization_id is distinct from old.organization_id
     or new.user_id is distinct from old.user_id then
    raise exception 'Membership identity is immutable; remove and re-invite instead.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.guard_organization_membership_update() from public;
create trigger trg_guard_organization_membership_update before update on public.organization_memberships
for each row execute function public.guard_organization_membership_update();

create table if not exists public.organization_verification_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.business_profiles(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'needs_information', 'approved', 'rejected', 'withdrawn')),
  legal_name text not null check (char_length(legal_name) between 2 and 160),
  registration_authority text,
  registration_reference text,
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists organization_verification_requests_queue_idx
  on public.organization_verification_requests (created_at) where status in ('submitted', 'in_review', 'needs_information');
create index if not exists organization_verification_requests_organization_idx
  on public.organization_verification_requests (organization_id, created_at desc);

alter table public.organization_verification_requests enable row level security;
create policy organization_verification_requests_read on public.organization_verification_requests
for select to authenticated using (
  submitted_by = (select auth.uid()) or public.can_manage_organization_members(organization_id) or coalesce(public.has_permission('business.review'), false)
);
create policy organization_verification_requests_submit on public.organization_verification_requests
for insert to authenticated with check (
  submitted_by = (select auth.uid()) and public.can_manage_organization_members(organization_id)
  and status = 'submitted' and reviewed_by is null and reviewed_at is null and review_note is null
);
create policy organization_verification_requests_withdraw on public.organization_verification_requests
for update to authenticated using (
  submitted_by = (select auth.uid()) and status in ('submitted', 'needs_information')
) with check (submitted_by = (select auth.uid()) and status = 'withdrawn');
create policy organization_verification_requests_reviewer_update on public.organization_verification_requests
for update to authenticated using (coalesce(public.has_permission('business.review'), false)) with check (coalesce(public.has_permission('business.review'), false));

create or replace function public.touch_organization_verification_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.id is distinct from old.id
     or new.organization_id is distinct from old.organization_id
     or new.submitted_by is distinct from old.submitted_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Verification request identity is immutable.';
  end if;
  if auth.uid() is null then
    raise exception 'Verification updates require an authenticated actor.';
  end if;
  -- Submitters retain withdrawal even when they also hold review permission.
  if old.submitted_by = auth.uid() and new.status = 'withdrawn' then
    if old.status not in ('submitted', 'needs_information')
       or (to_jsonb(new) - 'status' - 'updated_at') is distinct from
          (to_jsonb(old) - 'status' - 'updated_at') then
      raise exception 'Applicants may only withdraw an open request.';
    end if;
  else
    if not coalesce(public.has_permission('business.review'), false) then
      raise exception 'Verification review requires business.review.';
    end if;
    if old.submitted_by = auth.uid()
       or exists(select 1 from public.business_profiles b
                 where b.id = old.organization_id and b.owner_id = auth.uid())
       or exists(select 1 from public.organization_memberships m
                 where m.organization_id = old.organization_id and m.user_id = auth.uid()) then
      raise exception 'Reviewers cannot review affiliated organizations.';
    end if;
    if (to_jsonb(new) - array['status','review_note','updated_at']) is distinct from
       (to_jsonb(old) - array['status','review_note','updated_at']) then
      raise exception 'Review cannot rewrite submitted details or attribution.';
    end if;
    if old.status not in ('submitted', 'in_review', 'needs_information') then
      raise exception 'Closed verification requests cannot be reviewed.';
    end if;
    if new.status not in ('in_review', 'needs_information', 'approved', 'rejected') then
      raise exception 'Invalid verification review status.';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.touch_organization_verification_request() from public;
drop trigger if exists trg_touch_organization_verification_request on public.organization_verification_requests;
create trigger trg_touch_organization_verification_request before update on public.organization_verification_requests
for each row execute function public.touch_organization_verification_request();

comment on table public.organization_memberships is
  'Private organization-to-user membership. business_profiles remains the public organization record.';
comment on table public.organization_verification_requests is
  'Private verification metadata. Store source documents in protected object storage, not in this table.';

-- Do not depend on provider default privileges for newly created tables.
revoke all on public.organization_memberships from public, anon, authenticated;
grant select, insert, update, delete on public.organization_memberships to authenticated;
revoke all on public.organization_verification_requests from public, anon, authenticated;
grant select, insert, update on public.organization_verification_requests to authenticated;
grant all on public.organization_memberships, public.organization_verification_requests to service_role;

-- Audit only decision metadata; legal names and registration details stay private.
create or replace function public.audit_organization_verification_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'withdrawn' then return new; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values(auth.uid(), 'organization_verification.review', 'organization_verification_requests', new.id,
    jsonb_build_object('before_status', old.status, 'after_status', new.status));
  return new;
end;
$$;
revoke all on function public.audit_organization_verification_review() from public, anon, authenticated, service_role;
create trigger trg_audit_organization_verification_review after update on public.organization_verification_requests
for each row execute function public.audit_organization_verification_review();
