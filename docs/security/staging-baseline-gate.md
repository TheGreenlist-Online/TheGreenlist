# Staging baseline gate and COA reopening requirements

## Scope and current status

PR #60 adds checks, not a schema baseline or an intake release. It remains draft and intentionally fails closed. Do not mark it required or treat a preview deployment as acceptance evidence.

Read-only inspection on 2026-10-26 (America/Los_Angeles), using the existing Supabase connector, confirmed:

| Item | Staging `otmaxtjstvbfckpgbwdi` | Production `idtnlninotxwqpznbwur` |
| --- | --- | --- |
| Application tables in public | 0 | 28 |
| Application tables in private | 0 | 2 |
| Recorded migrations | 0 | Existing history; versions differ from repository names |
| Storage buckets | 0 | evidence, business-documents, education-materials, coa-sources |
| Auth users | 0 | Not inventoried; no user data copied |
| Core permission helpers | 0 | current_platform_role, has_permission, protect_profile_authority |
| Public tables without RLS | No tables to evaluate | 0 |

Staging project status is ACTIVE_HEALTHY on PostgreSQL 17. Its Security Advisor returned no notices, which does not establish readiness on an empty database. No database credentials were added, no schema/data was changed, and intake was not enabled.

Production currently contains `organization_memberships` and `organization_verification_requests`, contrary to the October 19 release notes. PR #29 is still open. Table existence does not establish that its current reviewed definitions were deployed. Reconcile their functions, constraints, grants, policies and audit behavior before choosing the restore baseline or replaying its migration.

## Connection guard repair

The original hostname-only check allowed libpq query options such as `hostaddr` to redirect a connection to another server.

The workflow now accepts only postgres/postgresql URLs with the exact approved staging hostname, port 5432 (or default), database postgres, an explicit simple username and password, and no fragment or raw whitespace/control characters. The only query option allowed is one sslmode=require or sslmode=verify-full. All other parameters, including host, hostaddr, service, servicefile, options, encoded overrides and duplicates, are rejected.

Before invoking psql, the shell removes inherited PG-prefixed environment variables and explicitly sets PGSSLMODE=require and PGCONNECT_TIMEOUT=10. This closes inherited PGHOSTADDR/PGSERVICE routing paths. A URL may request the stricter verify-full mode. This guard intentionally does not accept shared pooler hosts or arbitrary connection tuning; supporting them requires a separately reviewed isolation design.

Credential-free regression tests run before the live-secret check:
`python3 -m unittest discover -s tests -p 'test_staging_url_guard.py'`.

Do not add STAGING_DATABASE_URL yet. After review of the guard and confirmation that the runner can reach the approved direct host, provision a dedicated least-privileged, read-only staging connection through secure secret management. The gate connection is separate from any privileged application server key and from restore access. Never use a production connection or service-role API key for this check.

## Baseline work needed

The 19 repository SQL migrations are incremental. The first creates indexes on already-existing application tables; they cannot recreate an empty project. The production migration ledger also uses deployment-time versions that differ from some repository filenames. Do not run an indiscriminate db push or manufacture migration-history rows.

1. Freeze a source catalog snapshot and record the intended main/PR commit and capture time. Reconcile the organization-table drift before declaring that snapshot the accepted baseline.
2. Produce a schema-only application export, including public/private schemas, enums, domains, sequences, constraints, generated columns, indexes, views, functions, triggers, owners, grants, default privileges, RLS and policies. Review custom roles/extensions and remove environment-specific external integrations from the staging restore plan.
3. Capture custom Auth/Storage dependencies separately. Production has an AFTER INSERT auth.users trigger, on_auth_user_created_create_profile, calling handle_new_user_profile(). Storage policies and private bucket configuration must be restored; schema-only export alone does not create bucket rows or copy project Auth settings.
4. Validate the complete restore artifact in isolation, restore it to staging, and reconcile migration history against actual definitions. Apply only missing, reviewed changes in dependency order.
5. Compare definitions and effective privileges with the selected source. Matching table counts, migration names or RLS flags is insufficient.
6. Run real Auth/JWT and Storage HTTP acceptance, recovery tests and advisors. Keep the workflow's final BLOCKED exit until each missing gate has executable evidence.

A complete reviewed schema-only export is still needed. This session's catalog reads are an inventory, not that export. Shell networking could not reach its configured proxy, and no direct DB/export credentials or complete source dump are available here. Existing connector access supports the read-only inventory without adding secrets; no partial substitute schema was installed.

Supabase's [backup/restore guidance](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) documents separate migration-history handling and custom auth/storage restoration. Its full data-copy examples are not the staging plan: retain production identities, submissions and originals in production.

## Data required for testing

A production data copy is unnecessary. Use small, clearly synthetic fixtures and authorized test PDFs.

| Dataset | Minimum for private COA intake | Broader reopening coverage |
| --- | --- | --- |
| Reference configuration | Production-equivalent roles and permission mappings: currently 6 role_catalog rows and 42 role_permissions rows | Validate exact values against src/lib/roles.ts; counts alone are not parity |
| Identities | Two independently authenticated staging accounts, plus unauthenticated requests; include an anonymous-sign-in account to verify rejection | Add actors for each effective role/permission and relevant organization affiliation, including moderator without business.review and unrelated authorized reviewer |
| COA documents | An authorized original PDF, a second distinct PDF, and synthetic malformed/wrong-MIME/oversized variants | Different lab layouts, scans and phone photos are for later extraction-format acceptance |
| Intake records | Create through the real API: submitted, pending, failed, replay/conflict, quota-boundary cases | Never insert fictional analytical values as authenticated laboratory results |
| Other application records | Not needed to invent business/product identities for neutral COA submission | Synthetic businesses, membership/request conflicts, forum/report/document cases with owner/unrelated/reviewer access |
| Storage | Private coa-sources bucket, application/pdf only, 3 MiB maximum; synthetic objects created by test flow | Restore the other three private bucket definitions and test their distinct policies for broader reopening |

COA metadata already has an implementation: owner, generated submission ID/path, SHA-256, byte size, receipt time, optional raw product/batch descriptions and separate intake/extraction/review/authenticity/publication states. Unknown descriptions remain null. A laboratory directory, product catalog, canonical batches and parsed test results are not prerequisites for private intake.

Generate additional fixture attempts for concurrency and the five-per-24-hour / fifty-lifetime reservation limits. Avoid consuming ordinary tester quotas with repeated manual setup. Cleanup must verify exact paths and avoid deleting any object referenced by a submitted receipt.

## Information and configuration still needed

Most table and field requirements are recoverable from code and the source database. The remaining inputs are concrete:

- **Accepted baseline:** source snapshot and release commit, plus resolution of the organization-table drift. Private COA intake can be validated independently of shipping PR #29.
- **Staging application target:** exact preview/custom hostname and matching staging Supabase public configuration. Inspect deployed bindings; runtime variable readiness here does not prove the preview points at staging.
- **Auth setup:** controlled test identities, callback allowlist, confirmation/recovery/email behavior and applicable password settings. Use real staging sessions, not fabricated JWTs or privileged SQL as user-access proof.
- **Server access, later:** securely configure the staging-only server key required by COA Storage operations after isolation review. No credentials should be pasted into chat or committed. This is distinct from the later read-only Actions URL.
- **Test material:** permission to use the original test PDFs privately; synthetic invalid variants can be generated. No bulk production COA data is needed.
- **Operations:** named responsibility for removal/export requests, retention, failed-upload/orphan reconciliation, monitoring, request/body/time/rate limits and release signoff.

## Acceptance before intake opens

Keep COA_INTAKE_ENABLED=false until representative staging demonstrates:

1. Sign-in/confirmation/recovery and return to /coa/submit work with the actual preview origin.
2. Owner uploads one PDF, receives an immutable private receipt and downloads byte-identical content with matching SHA-256.
3. Another account, anonymous requests, anonymous-sign-in sessions and forged reviewer claims cannot read the receipt or source. Direct table mutations, Storage upload/list/get/update/delete/sign and bucket-public changes are denied.
4. Invalid/oversized/chunked uploads, foreign/missing Origin, expired sessions, duplicates and changed-payload replay fail correctly.
5. Parallel quota enforcement, Storage failure, interrupted finalization, lost-response recovery and exact-path cleanup preserve valid receipts and originals.
6. Mobile/keyboard/error-focus flows work; private responses are not indexed or cached; ingress limits and operational handling are established.
7. Catalog parity, actual grants/RLS/Storage policies and advisors are reviewed. Run authorization checks with real user sessions; use service access only for the server behavior that intentionally requires it.

Current phase one accepts private originals only. Extraction, human review tooling, source authentication and public result publication remain separate implementation and acceptance work; enabling intake does not enable them.

## Validation in this session

- Four Python URL-guard regression tests passed, including routing overrides and inherited libpq environment sanitation.
- The two targeted COA API/intake test files passed.
- The broader npm test run passed seven test files and could not load three database test files because @electric-sql/pglite is absent from the provided node_modules. No full-suite pass is claimed.
- No live upload, baseline restore, real-user authorization test or recovery acceptance was performed. The live workflow still cannot pass: the connection secret is absent and full semantic/role/recovery gates remain unimplemented.
