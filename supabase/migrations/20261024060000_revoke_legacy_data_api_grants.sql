-- Record the validated legacy-table cleanup; preserve service_role/postgres
-- privileges and existing RLS policies. Repeated revocation is safe.
revoke all privileges on table public.audit_logs from anon, authenticated;
revoke all privileges on table public.automation_jobs from anon, authenticated;
revoke all privileges on table public.business_documents from anon, authenticated;
