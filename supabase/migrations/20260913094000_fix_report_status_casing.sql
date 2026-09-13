-- Fix the public report read policy, which compared the wrong case.
--
-- reports_public_read (the only policy granted to anon) read:
--
--     using (status = 'PUBLISHED')
--
-- The application only ever writes lowercase. src/app/api/admin/reports/route.ts
-- validates status against 'submitted', 'under_review', 'needs_more_info',
-- 'published', 'resolved', 'rejected', and the report creation endpoint inserts
-- 'submitted'. Nothing has ever written 'PUBLISHED', so the predicate could
-- never be true and anonymous visitors could not read a single report, no matter
-- how many were published.
--
-- reports_auth_read, on the same table, already used lowercase 'published'
-- correctly. So a signed-in user could read published reports and an anonymous
-- one could not, which looks like an intentional signed-in wall but is a typo.
--
-- Root cause is that reports.status is free text with no constraint, so a
-- mismatched literal fails silently instead of erroring. Section 3 fixes that
-- class of bug rather than just this instance.

-- 1. Normalise any stored value that is not already lowercase ------------------
-- Currently every row is 'submitted', but the constraint below would reject a
-- mixed-case row, and rejecting existing data is worse than fixing it.
update public.reports
   set status = lower(status)
 where status <> lower(status);

update public.reports
   set verification_status = lower(verification_status)
 where verification_status is not null
   and verification_status <> lower(verification_status);

-- 2. The actual fix -----------------------------------------------------------
-- Kept scoped to anon exactly as before: authenticated readers are covered by
-- reports_auth_read, which already handles published reports plus the reporter's
-- own submissions.
drop policy if exists reports_public_read on public.reports;

create policy reports_public_read
  on public.reports
  for select
  to anon
  using (status = 'published');

comment on policy reports_public_read on public.reports is
  'Anonymous visitors may read published reports only. Status values are '
  'lowercase; see reports_status_check.';

-- 3. Stop this from recurring --------------------------------------------------
-- These are the vocabularies the application already enforces in
-- src/app/api/admin/reports/route.ts. Writing them down here means a typo or a
-- case mismatch raises an error at the point of the bad write, instead of
-- quietly producing a row that no policy will ever match.
alter table public.reports
  drop constraint if exists reports_status_check;

alter table public.reports
  add constraint reports_status_check
  check (status in (
    'submitted',
    'under_review',
    'needs_more_info',
    'published',
    'resolved',
    'rejected'
  ));

alter table public.reports
  drop constraint if exists reports_verification_status_check;

alter table public.reports
  add constraint reports_verification_status_check
  check (verification_status is null or verification_status in (
    'unverified',
    'in_review',
    'verified',
    'substantiated',
    'disputed',
    'unsubstantiated'
  ));

-- 4. Index the predicate the public path now actually uses ---------------------
-- Every anonymous request to the reports list evaluates status = 'published'.
create index if not exists reports_published_created_idx
  on public.reports (created_at desc)
  where status = 'published';
