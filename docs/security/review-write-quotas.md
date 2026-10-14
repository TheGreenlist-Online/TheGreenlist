# Write quota review and rollout gate

## Reviewed code
PR #36 incorporates main `3d8be6d` in `c9c449c`, preserving the #33 report/RPC, #37 role-RPC, and #39 content-workflow migration files. The quota trigger uses the selected database role, not JWT role strings; UTC buckets and accurate remaining-hour Retry-After are present.

Hourly per-account/table INSERT limits: reports, support tickets, and business claims 10; threads, documents, and education resources 20; replies 120. Private counters use a single atomic UPSERT key per account/action. Failed transactions do not consume quota. Client counter access and trigger-function RPC execution are revoked.

## October 14 staging evidence
A temporary preview, `pr36-write-quota-review`, was created with approved compute billing ($0.01344/hour, $1 pre-tax ceiling, removal after testing). Its automatic initialization had no application schema. A schema-only copy of production public/private objects, grants, RLS policies, triggers, and static role catalogs was loaded; no production user records were copied. The current main role-RPC/content guards and quota migration were then applied only there.

Verified:
- The #33 report/RPC baseline SQL suite passed before and after adding quotas.
- Hosted quota SQL regressions passed for authenticated callers, forged JWT role strings, absent/anonymous actors, service-role bypass, UTC timezone rotation, business claims, recovery, and privileges. The hosted runner cannot SET ROLE supabase_admin; that case remains covered by the passing disposable PostgreSQL CI suite.
- 32 simultaneous direct PostgREST report inserts produced exactly 10 HTTP 201 and 22 PT429/HTTP 429 responses. Business claims produced the same 10/22 result while varying UTC, Asia/Kolkata, and Asia/Kathmandu preferences.
- Denied requests left each counter at 10. Authenticated callers had no SELECT/UPDATE access to counters and no EXECUTE grant on the trigger function.
- A JWT altered to claim service_role was rejected with HTTP 401/PGRST301.
- Advancing the staging report bucket to the prior hour allowed a direct HTTP insert (201) and reset used to 1.
- Actual Next.js report and business POST handlers, running locally against preview Auth/PostgREST with a synthetic authenticated session, returned sanitized 429, Cache-Control: no-store, and remaining-hour Retry-After. This is a local application HTTP integration test, not a claim of Vercel browser/UI verification.
- All 12 Node regressions passed. Exact code-head CI quota, role-RPC, content-workflow, lint/build, CodeQL, Aikido, Vercel preview and Vercel Agent checks passed.
- Hosted role-RPC regressions passed after omitting SET SESSION AUTHORIZATION (not permitted by the hosted runner) and setting the administrator fixture through a transaction-scoped setup.

## Existing baseline and automation failures
Tracked separately in [issue #46](https://github.com/TheGreenlist-Online/TheGreenlist/issues/46):
1. Production has_permission(text) compares role_permissions.role (app_role) to current_platform_role() (text). The production schema copy reproduces SQLSTATE 42883 during document-review validation. Full content-workflow acceptance against that real baseline remains blocked; the passing CI fixture does not reproduce this type drift.
2. Automatic Supabase preview replay fails in existing 20260913071000_unify_role_system.sql with role_rank(app_role) not found. This failure is not a quota-trigger defect and has not been hidden or treated as a successful check.

## Production gate
Supabase GitHub Deploy to production was enabled for main; it was disabled, saved, and confirmed disabled after reload on October 14. Production quota objects remain absent. No production schema migration was applied by this review.

Keep automatic production migrations disabled until issue #46 is repaired and the real-schema moderation and migration replay checks pass. A code merge does not authorize database rollout.

## Coverage limits
This quota layer covers successful INSERT rows only. It does not cover read/IP floods, AI spending, updates/drafts, Storage, or Realtime. The concurrency evidence covers bounded test bursts and does not establish all load, deadlock, or hour-boundary behavior.
