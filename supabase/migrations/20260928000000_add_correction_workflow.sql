-- Correction workflow: persist the states the public documents promise.
--
-- /about/corrections tells readers to submit a correction request through the
-- evidence intake by selecting "correction request", and /about/methodology
-- lists "Corrected" as a report state. Neither value could be stored:
-- reports_report_type_check had no correction type and reports_status_check
-- had no corrected state. This migration adds both so the documented workflow
-- is real rather than aspirational.
--
-- Vocabulary is mirrored in the application:
--   src/lib/report-types.ts          (report_type)
--   src/lib/report-status.ts         (status labels and tones)
--   src/app/api/admin/reports/route.ts (allowed status writes)

-- 1. Report type ---------------------------------------------------------------
alter table public.reports
  drop constraint if exists reports_report_type_check;

alter table public.reports
  add constraint reports_report_type_check check (
    report_type in (
      'mislabeling',
      'contamination',
      'licensing',
      'worker_safety',
      'deceptive_marketing',
      'correction_request',
      'other'
    )
  );

-- 2. Report status -------------------------------------------------------------
-- "corrected" is a published finding that was amended after publication. It is
-- still a published finding; only the log entry and label differ.
alter table public.reports
  drop constraint if exists reports_status_check;

alter table public.reports
  add constraint reports_status_check
  check (status in (
    'submitted',
    'under_review',
    'needs_more_info',
    'published',
    'corrected',
    'resolved',
    'rejected'
  ));

-- 3. Public read follows publication, including amended findings ---------------
drop policy if exists reports_public_read on public.reports;

create policy reports_public_read
  on public.reports
  for select
  to anon
  using (status in ('published', 'corrected'));

comment on policy reports_public_read on public.reports is
  'Anonymous visitors may read published findings only, including findings '
  'amended after publication (status = corrected). Status values are '
  'lowercase; see reports_status_check.';

-- The partial index from 20260913094000 only covers status = 'published';
-- rebuild it over the predicate the policy now evaluates.
drop index if exists reports_published_created_idx;

create index if not exists reports_published_created_idx
  on public.reports (created_at desc)
  where status in ('published', 'corrected');
