-- Make business claims actually submittable, and stop owners from grading
-- themselves.
--
-- Two problems this fixes:
--
-- 1. `business_profiles` had RLS enabled and NO insert policy, so
--    POST /api/businesses could never write a row. The claim form has been
--    failing for every user; the table is empty as a result.
--
-- 2. `businesses_owner_write` allowed an owner to update any column on their
--    own row — including `verification_status`, `trust_rating`,
--    `transparency_score` and `sponsorship_status`. An owner could mark their
--    own business verified and hand themselves a trust rating. On a
--    transparency platform those fields are the whole product, so they must be
--    writable only by reviewers.

-- 1. Let an authenticated user file a claim on their own behalf, starting
--    unverified. The check on verification_status stops a crafted insert from
--    arriving pre-verified.
drop policy if exists businesses_owner_insert on public.business_profiles;

create policy businesses_owner_insert
  on public.business_profiles
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and coalesce(verification_status, 'unverified') = 'unverified'
  );


-- 2. Reviewer-owned columns are preserved on any update that does not come from
--    a trusted server context. Attempts are silently ignored rather than raising,
--    because the owner edit form submits the whole row and a legitimate
--    description change should not fail.
create or replace function public.protect_business_review_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
begin
  v_role := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    current_user
  );

  -- Service role (admin-gated API routes) and direct database sessions are
  -- trusted to set review outcomes.
  if v_role in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  new.verification_status := old.verification_status;
  new.sponsorship_status := old.sponsorship_status;
  new.trust_rating := old.trust_rating;
  new.transparency_score := old.transparency_score;

  return new;
end;
$$;

comment on function public.protect_business_review_fields() is
  'Prevents business owners from setting their own verification, sponsorship, trust or transparency values.';

drop trigger if exists trg_business_profiles_protect_review_fields on public.business_profiles;

create trigger trg_business_profiles_protect_review_fields
  before update on public.business_profiles
  for each row
  execute function public.protect_business_review_fields();


-- The review queue reads pending claims oldest-first.
create index if not exists business_profiles_pending_claims_idx
  on public.business_profiles (created_at)
  where is_claimed = true and verification_status = 'unverified';
