-- Recovered source snapshot; local review/testing only. No user records.
comment on function public.humanize_status(pg_catalog.text) is 'Formats a status token for display in notification copy.';
comment on function public.notify_business_claim_decision() is 'Notifies a business owner when their claim is approved, denied, or otherwise changed.';
comment on function public.notify_report_status_change() is 'Notifies a reporter when their report changes status or verification state.';
comment on function public.protect_business_review_fields() is 'Prevents business owners from setting their own verification, sponsorship, trust or transparency values.';
comment on function public.search_public_content(pg_catalog.text,integer,integer) is 'Ranked public content search. SECURITY INVOKER preserves table RLS; hard-capped at 50 rows.';
comment on table public.ai_audit_logs is 'Metadata-only audit trail for AI feature usage. Stores classifications and record references, never prompts, drafts, evidence or model output.';
comment on table public.automation_jobs is 'Background job history. Written only by runJob() via the service role, which bypasses RLS. Review authority may read it; there is deliberately no write policy, so a user session cannot forge job records.';
comment on table public.organization_memberships is 'Private organization-to-user membership. business_profiles remains the public organization record.';
comment on table public.organization_verification_requests is 'Private verification metadata. Store source documents in protected object storage, not in this table.';
comment on table public.role_permissions is 'Application RBAC matrix for Users & Access. Authorization decisions remain server/database enforced.';
comment on table public.user_moderation_actions is 'Auditable human moderation and access-control actions against user accounts.';
comment on column public.ai_audit_logs.human_review_required is 'True when the output is a recommendation that an accountable human must decide on before any action is taken.';
comment on column public.ai_audit_logs.records_accessed is 'Array of { record_type, record_id } references to records the AI read. References only, never content.';
comment on column public.business_profiles.owner_id is 'Owning user. Defaults to the authenticated user for client-created records; may remain null for privileged imports.';
comment on column public.nda_signatures.document_version is 'Version identifier of the NDA document accepted by the signer.';
comment on view public.user_roles is 'Compatibility view over profiles.role, which is the single source of truth for roles. Formerly a separate table that no application code maintained. Do not write here; update profiles.role.';
