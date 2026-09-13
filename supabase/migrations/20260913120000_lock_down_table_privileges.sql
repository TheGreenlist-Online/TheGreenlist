-- Give automation_jobs explicit policies, and close a hole that row-level
-- security cannot cover.
--
-- The starting point was a report that drafts and automation_jobs "have RLS
-- enabled with zero policies, so they are unusable". Only half of that was true,
-- and the half that was true was not the real problem.
--
-- drafts already has correct policies: drafts_owner_select / _insert / _update /
-- _delete, each scoped to authenticated and keyed on auth.uid() = user_id. It
-- works. This migration does not touch it.
--
-- automation_jobs genuinely had no policies, but it is written only by
-- src/lib/jobs/runJob.ts and read only by src/app/admin/news/page.tsx, and both
-- go through createSupabaseAdminClient() — the service role, which bypasses RLS.
-- So the table was never "unusable"; deny-all to anon and authenticated is the
-- correct posture for a table only background jobs write. The problem was that
-- the posture was accidental rather than declared: an empty policy list is
-- indistinguishable from someone forgetting to add policies, which is exactly
-- how it got reported as broken.
--
-- Section 1 declares the intent. Section 2 fixes the actual vulnerability found
-- while checking that intent.

-- 1. Declare automation_jobs' access model -----------------------------------
-- Read access for review authority, so job history can be inspected through a
-- normal user session instead of requiring the service role. No insert, update
-- or delete policy is created on purpose: job rows are written exclusively by
-- runJob(), which uses the service role and is not subject to RLS. Adding a
-- write policy here would let a signed-in user forge automation history.
drop policy if exists automation_jobs_reviewer_read on public.automation_jobs;

create policy automation_jobs_reviewer_read
  on public.automation_jobs
  for select
  to authenticated
  using (public.is_reviewer());

comment on table public.automation_jobs is
  'Background job history. Written only by runJob() via the service role, which '
  'bypasses RLS. Review authority may read it; there is deliberately no write '
  'policy, so a user session cannot forge job records.';

-- 2. Revoke privileges that row-level security does not gate -----------------
-- Every table in public granted TRUNCATE to both anon and authenticated,
-- inherited from a blanket `grant all`. TRUNCATE is not filtered by RLS: a
-- policy restricts which rows a statement sees, but TRUNCATE is checked only
-- against the table privilege. Verified against production before this change:
-- as anon, with RLS active, SELECT on drafts and automation_jobs correctly
-- returned 0 rows, and `truncate public.drafts` and
-- `truncate public.automation_jobs` both SUCCEEDED, emptying them. Anyone
-- holding the publishable anon key — which ships in the browser bundle — could
-- have wiped any table in the schema.
--
-- Nothing in the application truncates anything; this privilege has no
-- legitimate use from a client role. TRIGGER and REFERENCES are revoked for the
-- same reason: neither is needed by a client role, and both let a caller attach
-- structures to a table it does not own.
--
-- SELECT, INSERT, UPDATE and DELETE are deliberately left in place. Those are
-- the privileges RLS actually gates, and the existing policies depend on them.
revoke truncate, trigger, references on all tables in schema public from anon;
revoke truncate, trigger, references on all tables in schema public from authenticated;

-- 3. Stop new tables from inheriting the same hole ---------------------------
-- The default ACL for the schema included TRUNCATE/TRIGGER/REFERENCES for anon
-- and authenticated, so section 2 alone would fix only today's tables and every
-- table created afterwards would arrive vulnerable again.
alter default privileges in schema public
  revoke truncate, trigger, references on tables from anon;

alter default privileges in schema public
  revoke truncate, trigger, references on tables from authenticated;

-- Supabase creates objects as both postgres and supabase_admin depending on the
-- path, and each owner carries its own default ACL, so both are cleared.
alter default privileges for role postgres in schema public
  revoke truncate, trigger, references on tables from anon;

alter default privileges for role postgres in schema public
  revoke truncate, trigger, references on tables from authenticated;

-- 4. Residual gap, documented deliberately ------------------------------------
-- Section 3 clears the default ACL owned by postgres, which is what migrations
-- run as, so anything created by a migration is now safe. Supabase also keeps a
-- separate default ACL owned by supabase_admin, and that one still grants
-- TRUNCATE/TRIGGER/REFERENCES to anon and authenticated. It cannot be cleared
-- from here: postgres is not a member of supabase_admin, and the attempt fails
-- with "permission denied to change default privileges".
--
-- Practical effect: a table created through a migration is fine, but a table
-- created by a path that runs as supabase_admin can arrive with TRUNCATE granted
-- to anon again. If that happens, re-run section 2. To check for it:
--
--   select table_name from information_schema.role_table_grants
--    where table_schema = 'public' and grantee in ('anon','authenticated')
--      and privilege_type = 'TRUNCATE';
--
-- That query returning any row means the hole is open again.
