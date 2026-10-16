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
create policy organization_memberships_manage on public.organization_memberships
for all to authenticated using (public.can_manage_organization_members(organization_id))
with check (public.can_manage_organization_members(organization_id) and role <> 'owner');

-- The root owner row is system-created and cannot be changed or removed by the
-- member-management workflow.
create or replace function public.protect_organization_owner_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    raise exception 'The organization owner membership cannot be removed.';
  end if;
  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' then
    raise exception 'The organization owner membership cannot be changed.';
  end if;
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    return new;
  end if;
  return old;
end;
$$;
revoke all on function public.protect_organization_owner_membership() from public;
drop trigger if exists trg_protect_organization_owner_membership on public.organization_memberships;
create trigger trg_protect_organization_owner_membership before update or delete on public.organization_memberships
for each row execute function public.protect_organization_owner_membership();

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
  submitted_by = (select auth.uid()) or public.can_manage_organization_members(organization_id) or public.is_reviewer()
);
create policy organization_verification_requests_submit on public.organization_verification_requests
for insert to authenticated with check (
  submitted_by = (select auth.uid()) and public.can_manage_organization_members(organization_id)
);
create policy organization_verification_requests_withdraw on public.organization_verification_requests
for update to authenticated using (
  submitted_by = (select auth.uid()) and status in ('submitted', 'needs_information')
) with check (submitted_by = (select auth.uid()) and status = 'withdrawn');
create policy organization_verification_requests_reviewer_update on public.organization_verification_requests
for update to authenticated using (public.is_reviewer()) with check (public.is_reviewer());

create or replace function public.touch_organization_verification_request()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status in ('approved', 'rejected') and old.status is distinct from new.status then
    new.reviewed_at := coalesce(new.reviewed_at, now());
  end if;
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
