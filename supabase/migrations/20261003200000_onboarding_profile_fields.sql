-- ---------------------------------------------------------------------------
-- Onboarding: participation type, standards acknowledgement, age attestation,
-- and completion marker on profiles.
--
-- Pairs with 20261003180000_free_tier_entitlements (which also adds
-- age_attested_at with `if not exists`; order does not matter).
--
-- Writes go through one RPC so the browser never updates these columns
-- directly: attestation is one-way (set once, never cleared by the user),
-- participation is a declaration (never a role), and the completion stamp is
-- set by the server when the required steps are present.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists age_attested_at timestamptz,
  add column if not exists standards_acknowledged_at timestamptz,
  add column if not exists participation text
    check (participation in ('consumer', 'professional', 'business')),
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.participation is
  'Self-declared way of taking part: consumer, industry professional, or business representative. A declaration, not a role; roles stay in profiles.role and are assigned by humans.';
comment on column public.profiles.standards_acknowledged_at is
  'When the user acknowledged the community standards (no sales, no marketing, claims are labelled not verified).';
comment on column public.profiles.onboarding_completed_at is
  'Set by complete_onboarding() once participation, attestation and standards are all present.';

create or replace function public.complete_onboarding(
  p_participation text,
  p_attest_age boolean default false,
  p_acknowledge_standards boolean default false
)
returns table (
  participation text,
  age_attested_at timestamptz,
  standards_acknowledged_at timestamptz,
  onboarding_completed_at timestamptz
)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  if p_participation is not null and p_participation not in ('consumer', 'professional', 'business') then
    raise exception 'invalid_participation' using errcode = '22023';
  end if;

  update public.profiles p
     set participation             = coalesce(p_participation, p.participation),
         -- one-way: once attested, never un-attested by this path
         age_attested_at           = case when p_attest_age then coalesce(p.age_attested_at, now()) else p.age_attested_at end,
         standards_acknowledged_at = case when p_acknowledge_standards then coalesce(p.standards_acknowledged_at, now()) else p.standards_acknowledged_at end,
         updated_at                = now()
   where p.id = v_uid;

  -- Completion requires all three. Stamp once; never clear.
  update public.profiles p
     set onboarding_completed_at = coalesce(p.onboarding_completed_at, now())
   where p.id = v_uid
     and p.participation is not null
     and p.age_attested_at is not null
     and p.standards_acknowledged_at is not null;

  return query
    select p.participation, p.age_attested_at, p.standards_acknowledged_at, p.onboarding_completed_at
      from public.profiles p
     where p.id = v_uid;
end;
$$;

comment on function public.complete_onboarding(text, boolean, boolean) is
  'Records onboarding declarations for the signed-in user. Attestation and acknowledgement are set-once. Never touches profiles.role.';

revoke execute on function public.complete_onboarding(text, boolean, boolean) from public, anon;
grant execute on function public.complete_onboarding(text, boolean, boolean) to authenticated;

-- Admin visibility: how far new accounts get. No per-user detail beyond what
-- reviewers can already read on profiles.
create or replace view public.onboarding_funnel
with (security_invoker = true) as
  select date_trunc('week', created_at)::date                                         as week,
         count(*)                                                                      as signups,
         count(*) filter (where participation is not null)                             as declared,
         count(*) filter (where age_attested_at is not null)                           as attested,
         count(*) filter (where onboarding_completed_at is not null)                   as completed,
         count(*) filter (where participation = 'business')                            as business,
         count(*) filter (where participation = 'professional')                        as professional
    from public.profiles
   group by 1;
