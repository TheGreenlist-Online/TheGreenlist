# October 30 Data API grants audit (2026-10-23)

Status: **staging blocked; production unchanged**.

Supabase project: `idtnlninotxwqpznbwur`. Read-only inspection found 28 public tables, all with RLS enabled. `organization_memberships` and `organization_verification_requests` already exist in production with explicit authenticated privileges. Reconcile actual migration history before replaying PR #29. The Supabase branch named `main` reports `MIGRATIONS_FAILED`; do not use it as proof of staging parity.

## PR #31 review

- `20261003180000_free_tier_entitlements.sql`: explicit authenticated SELECT on `entitlement_limits`, `entitlement_adjustments`, `ai_usage_events`; restricted writes on limits and adjustments via RLS; usage inserts intentionally only through a function.
- `20261003190000_records_ingestion_pipeline.sql`: explicitly revokes anonymous/authenticated table access then grants authenticated SELECT on eight ingestion tables under reviewer RLS; column-scoped UPDATE on `editorial_drafts`; grants public SELECT on `published_records`. No general anonymous access to raw ingestion tables.
- `20261003200000_onboarding_profile_fields.sql`: explicit authenticated EXECUTE on `complete_onboarding`.
- No missing automatic table grant confirmed in these migrations. Do not add broad grants as a precaution.

## Staging gate

1. Repair the preview branch migration failure and provision a schema-faithful isolated branch from the correct parent. Compare migration history, public tables, functions, grants, RLS, policies and storage policies to the intended baseline.
2. Apply pending migrations in repository order **only on staging**, recording exact migration versions and checks.
3. Query `information_schema.role_table_grants`, `pg_class.relrowsecurity`, `pg_policies`, `pg_proc.proacl` and view definitions. Confirm every newly created table has explicit intended privileges, including `service_role` as applicable.
4. Run real JWT/API tests for anonymous, ordinary user, organization owner/admin/editor/viewer, unrelated user, reviewer and service role. Test SELECT/INSERT/UPDATE/DELETE both allowed and denied. Include RPC access, column-level draft update denial, COA privacy, report privacy and published-record visibility.
5. Require positive and negative assertions; RLS-only SQL tests do not substitute for PostgREST calls. Verify schema resets under the new default-grant behavior.
6. If a concrete missing privilege is proven, add a narrowly scoped additive migration on this branch, paired with a regression test. Do not modify historical deployed migrations or weaken RLS.
7. Merge only after staging parity, migration success, all required checks, reviewer approval and a documented rollback plan. Production migration promotion requires a separate decision.

## Existing-production security follow-up

Older tables including `audit_logs`, `automation_jobs` and `business_documents` retain broad `anon` and `authenticated` ACLs despite enabled RLS. Audit their actual API usage and RLS policies separately before revoking any privilege. This is defense-in-depth cleanup, not a demonstrated October 30 regression.
