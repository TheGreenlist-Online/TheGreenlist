# Staging bootstrap investigation and next secure handoff

## Current decision

BLOCKED_BOOTSTRAP / BLOCKED_CONNECTION. PR #60 remains draft. No source
schema is approved, no database was changed, and no secret was created by this
investigation. The new plan validator is a provenance/ordering check only, not an
executable restore or proof of SQL safety. Its pending manifest intentionally fails.
No production rows, identities, credentials, or Storage objects were copied.

## Evidence gathered

Source repository: PR #60 head `4e4563a6722b518aa2c8b6a552c2cd1bb5d42616`.
Read-only inspections performed November 1, 2026 (America/Los_Angeles).

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Staging identity/health | PASS | `otmaxtjstvbfckpgbwdi`, TheGreenlist-Staging, ACTIVE_HEALTHY, us-east-2, PostgreSQL 17.11 |
| Staging application schemas | FAIL_SCHEMA | No public/private application tables |
| Staging migration ledger | ABSENT | `to_regclass('supabase_migrations.schema_migrations')` returned null; do not misreport a missing ledger as an empty ledger |
| Staging buckets | FAIL_SCHEMA | `storage.buckets` count = 0 |
| Production catalog inventory | PASS_INVENTORY | 28 public tables, 2 private tables; all 30 have RLS enabled; `public.user_roles` is a view, not an additional table |
| Base schema in repository history | REJECTED_CANDIDATE | `c550392b99792a6b32f40269aab21c560ac00168` adds legacy Prisma/NextAuth tables. Removed by `d2d96600e3828e2adbb2c4231e3b9eb92274c1b2`; these do not match current Supabase objects |
| Earlier production migrations | PARTIAL_SOURCE | Eleven application entries before September 12 retain SQL (June 28–August 24). Older ledger entries have null statement bodies; replaying the ledger cannot supply a complete initial schema |
| Required `business_documents` source | LOCATED_PARTIAL | Ledger version `20260805161152`, `add_verified_facts_business_documents_drafts_news_automation_jobs`; associated RLS version `20260805161516`. These depend on earlier objects and are not a standalone bootstrap |
| Migration filename parity | FAIL_RECONCILIATION | Example repository `20260912213610` vs deployed `20260912213507`; later deployment versions also differ. Compare definitions, never manufacture history |
| GitHub staging connection | BLOCKED_CONNECTION | October 29 run reported missing STAGING_DATABASE_URL. Current secret existence cannot be read through the GitHub connector; it excludes secrets APIs |
| Real JWT / role authorization | NOT_RUN | Missing baseline and staging app/test identities |
| Storage HTTP / recovery | NOT_RUN | Missing baseline, buckets, and secure runtime configuration |

The existing October 29 disposable replay failure remains applicable; it has not
been rerun against a reconstructed schema. The diagnostic now records NOT_RUN for
each remaining migration after the first failure rather than omitting them.

## Bootstrap path requiring schema review

Use the live production catalog as the candidate source of definitions, with a
pinned snapshot time. It is not automatically an accepted release baseline.
Supabase's backup/restore documentation describes schema export and separate
custom Auth/Storage handling:
https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

1. In an authorized export environment, capture a PostgreSQL 17 schema-only dump
   of public/private. Use a read-only source connection through the environment's
   secret manager; no passwords in commands, chat, tracked files, or logs. Keep
   ownership, ACL/default ACL, types, functions, constraints, indexes, policies,
   views and triggers. Do not dump role passwords or table data. Inspect SQL for
   embedded credentials, external URLs/webhooks, FDWs and environment bindings.
2. Separately collect custom triggers on auth.users, application Storage policies,
   required extensions and role definitions without passwords. Never restore the
   managed auth/storage schemas wholesale. Review private bucket metadata and
   role/permission configuration individually; recreate only approved reference
   configuration, with zero identities, submissions, evidence or objects.
3. Resolve PR #29's live vs proposed definitions before accepting the snapshot.
   Place reviewed artifacts under `supabase/bootstrap/staging/`; record SHA-256,
   timestamp, source/release SHA and review references in `plan.json`.
4. For every migration in plan.json, compare full definitions and effective
   permissions. Mark included_in_snapshot only with comparison evidence; mark
   apply_after_snapshot only when the missing change is reviewed and compatible.
   Preserve filename order for incremental application. If that order cannot
   work, correct and review the plan/code rather than silently reordering SQL.
5. Prove an empty restore and ordered incremental application on a disposable
   Supabase-compatible instance, including real managed Auth/Storage dependencies.
   Plain postgres:17 is useful for the existing negative diagnostic but does not
   provide those managed schemas/services. Review the evidence before setting
   disposable_restore_evidence or status=reviewed. The validator checks references
   exist as text; reviewers must inspect the actual referenced evidence.
6. Only after that review, implement/execute the staging-only restore with the
   existing exact-host isolation guard, distinct restore credentials, empty-target
   assertions, ON_ERROR_STOP, transactional execution where supported, and
   per-file results. No production write route and no migration-history repair.
   This change does not yet provide that executor: missing artifacts prevent
   responsibly testing one. Do not interpret PASS_PLAN_REVIEW as permission to
   restore or as database acceptance.
7. Compare schema semantics/ACLs and run allow/deny tests for all platform and
   organization roles, cross-account access, role escalation, reviewer boundaries,
   Auth triggers and private Storage. Perform restore/recovery drills and advisors.
   Leave the original baseline workflow's unconditional BLOCKED exit in place
   until executable evidence covers all requirements.

## Secure Actions connection handoff

The available GitHub connector cannot inspect/create Actions secrets or dispatch
new workflow runs. This workspace has no gh, psql, Docker, Supabase CLI, or
credential-bearing database environment configured. Do not send credentials here
or rotate production passwords to work around this limitation.

After baseline and grant review, an authorized repository/Supabase administrator
must use a secure secret-manager/CLI session or the respective settings interfaces:

- Create a dedicated staging-only CI login with no SUPERUSER, CREATEDB,
  CREATEROLE, REPLICATION or BYPASSRLS; no application/owner-role memberships,
  ownership, or table write privileges. Grant only CONNECT and the catalog
  visibility needed by the gate. No application row SELECT is currently needed.
- Inspect effective PUBLIC privileges too: a REVOKE on the login does not negate
  PUBLIC grants. Deny access to callable mutating SECURITY DEFINER helpers;
  default_transaction_read_only alone is not an authorization boundary. Review
  any PUBLIC-grant cleanup against intended anon/authenticated permissions.
- Generate the login's credential inside the secure admin environment, install it
  directly as Actions secret STAGING_DATABASE_URL, and discard local material.
  Use the exact direct staging host, database postgres, port 5432, and TLS. Check
  runner IPv6/direct-host reachability; do not relax the guard to accept a shared
  pooler just to make connectivity pass. No bootstrap/admin URL in this secret.
- If using a protected GitHub environment, first add matching environment binding
  to the baseline job; the current job resolves repository/organization secrets.
  Never put live secrets on a pull_request_target job checking untrusted code.
- Rerun the baseline and replay on the new reviewed head. Record exact SHA, run
  URLs, per-check outcomes and artifacts. No rerun is claimed in this report.

## Verification of this change

Ten credential-free Python tests pass: six bootstrap-plan tests and four existing
URL-isolation tests. Tests cover wrong targets, unreviewed plans, missing/new or
duplicate migration inventory, changed SQL hashes, artifact path/symlink escape,
and unresolved decisions. Running the validator against the checked-in manifest
exits 1 with BLOCKED_BOOTSTRAP and lists the unresolved prerequisites.

This is partial progress. A reviewed schema-only artifact bundle, secure Actions
secret provisioning, actual restore, replay, semantic authorization and recovery
acceptance remain outstanding. Neither a successful source inventory nor the new
plan check opens the merge gate.
