# Supabase hardening review — 2026-10-06

Target: TheGreenlist production project `idtnlninotxwqpznbwur`.
Repository baseline: `68e3cc7609368470681fb14bbf25485be5b55871`.

## Applied and verified

Migration `20261006233439_harden_report_writes_and_public_rpc_limits.sql` was applied to production through Supabase MCP. The filename matches the recorded production migration version.

- Removed anonymous INSERT/UPDATE/DELETE grants on ai_audit_logs and its anonymous INSERT policy. Anonymous callers previously could grow this table by inserting rows with user_id NULL.
- Added an invoker trigger on reports: ordinary client roles can submit only initial, unverified reports and cannot set moderation fields. Submitted reports can be edited; reviewed reports require the correction workflow. Existing service-role moderation writes continue to work.
- Bounded reporter-supplied report text (title 160 characters; description 50,000; location/business-name fields 160).
- Revoked client EXECUTE on three internal trigger functions. They remain usable by their table triggers.
- Kept search SECURITY INVOKER and existing RLS. Search input must be 2–256 characters; existing limit stays 50 and offset is capped at 1,000.
- Corrected three category predicates that passed text to role_category(app_role). Real RLS testing exposed this runtime failure.
- Optimized seven policies by evaluating auth.uid() with scalar subqueries.

Tests: `supabase/tests/report-and-rpc-hardening.sql`, run as the database migration owner in a transaction that rolls back. Passed before and after deployment: normal submission/edit; denied publication/verification/notes forgery/pre-published insert/oversized text; service-role review; denied edits after publication; private report isolation across two fixture accounts; anonymous audit-insert privilege removal; oversized search returns zero rows. The fixtures use example.invalid emails and leave no persistent data.

## Existing protection confirmed

All 25 public base tables have RLS enabled. No public base table grants TRUNCATE to anon or authenticated. Anonymous statement timeout is 3 seconds and authenticated timeout is 8 seconds. These do not establish flood resistance.

## Remaining work

1. Durable per-account write quotas and per-IP/per-account request limiting. Rate limiting only Next.js routes would leave direct Supabase calls outside that control. PostgREST pre-request limits also do not cover Storage or Realtime.
2. Review client grants column by column. The profile trigger protects identity and role assignment, but other authority fields (account status, verification and scores) still need protection. Report row policies expose all readable columns: public reads must be redesigned to exclude reporter identity, full private accounts, and admin notes, including anonymous reports. Migrate public readers to a curated view/RPC before restricting underlying SELECT grants.
3. Audit remaining helper RPCs. Nine public-anonymous and ten authenticated SECURITY DEFINER advisor warnings remain. Many are permission helpers referenced by RLS; blanket revocation can break policies. platform_role(uuid) is currently a cross-user role lookup and needs review.
4. Enable leaked-password protection; verify CAPTCHA, signup limits, upload size/type quotas and bucket limits. Auth settings were not changed.
5. Resolve seven multiple-permissive-policy warnings. Keep the 39 unused indexes pending real workload analysis; they are not by themselves a vulnerability.
6. Verify project Data API max-row settings, backup/restore coverage, pooling/resource budget, and monitoring. Do load testing in staging; the available dev project is currently inactive.

No claim of outage-proof operation or comprehensive security coverage is made. No schema changes in this review remove existing table data.

Advisor remediation references:
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://supabase.com/docs/guides/api/securing-your-api
