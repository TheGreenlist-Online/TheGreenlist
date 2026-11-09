-- Record the validated legacy-table cleanup; preserve service_role/postgres
-- privileges and existing RLS policies. Repeated revocation is safe.
revoke all privileges on table public.audit_logs from anon, authenticated;
revoke all privileges on table public.automation_jobs from anon, authenticated;
revoke all privileges on table public.business_documents from anon, authenticated;

-- Existing application routes use user-session clients, not service_role.
-- Preserve only the operations they need; existing RLS and review guards apply.
grant select on table public.audit_logs to authenticated;
grant select on table public.business_documents to anon, authenticated;
grant insert, update on table public.business_documents to authenticated;
