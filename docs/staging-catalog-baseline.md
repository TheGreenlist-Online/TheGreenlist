# Captured application baseline and disposable validation

## Review scope

This package is a schema-only application snapshot captured October 27, 2026,
not an assertion about today's production or a hosted restore approval. Source
catalog recovery was explicitly authorized and read-only. The new repository work
does not connect to production or write to staging. Raw catalog exports, project
runtime configuration, role-membership inventories, migration ledger dumps,
archives, user/Auth records and Storage object metadata/bytes are excluded.

The published SQL contains the reviewed application definitions and only allowed
reference configuration: six role catalog entries, 42 permission mappings and four
private bucket definitions. The reference data is configuration, not user data.
There are no account IDs, credentials or environment-specific URLs. PostgreSQL's
standard role names in owners/ACLs are intentional schema dependencies.

The retained local evidence compared the reconstructed schema with 16 captured
catalog sets and the application RLS event trigger. The repository publishes only
the schema and category/count/checksum fingerprints needed to validate it, not the
raw catalog evidence. MD5 here is a deterministic drift check, not an authenticity
signature; plan artifacts use SHA-256 and require normal code review. Tests do not
regenerate their expected fingerprints.

`prepared_local` means source/privacy review and local preparation, **not** human
PR approval or hosted acceptance. `check-staging-bootstrap.py --local` verifies
that scope. The default command still requires `reviewed` and fails closed. The
hosted workflow still ends BLOCKED even if catalog comparison succeeds, because
real Auth/JWT/Storage HTTP and recovery acceptance are not implemented.

## Ordering and prerequisites

Execute the numbered files in filename order in one transaction on an empty
application schema. The local runner does this only in a disposable database.
The phases check managed dependencies, create enums/tables, create functions,
add constraints/indexes/views, add custom triggers, restore policies/ACLs/defaults,
load reference configuration, and restore comments. Nonempty tables, types or
functions are rejected; an existing public RLS helper in a hosted project may
therefore require an explicitly reviewed target reconciliation before any restore.

The capture contains 28 public tables, two private tables, one view, three enums,
36 routines, 127 constraints, 101 indexes, 22 application/custom Auth triggers,
the `ensure_rls` event trigger and 93 policies. All four buckets are private.

Managed Auth/Storage schemas and their implementation triggers remain platform
dependencies. `supabase/tests/bootstrap-platform-fixture.sql` is solely a small
SQL test model; never install it on hosted staging. Platform roles and extensions
are checked or documented, never provisioned by the application restore. Hosted
managed schema/ACL compatibility still needs separately authorized verification.

## Migration history

This is a final-state snapshot, not a pre-September foundation. Do **not** replay
the 19 old incremental migrations after it. Each plan entry records its captured
or superseded schema effects. Historical application row rewrites are not copied
or replayed; the empty application tables deliberately contain no customer content.
The plan has no `apply_after_snapshot` entries. New migrations require an explicit
new decision and tests; checksum/inventory checks reject unnoticed changes.

Production ledger names/versions differ from repository filenames and some names
are absent despite present definitions. No ledger rows are manufactured. Future
hosted history reconciliation must compare definitions, not infer deployment from
timestamps. The organization table/function/policy definitions matched the PR29
candidate in local reconstruction; that is not a claim about PR deployment history.

## Faithful permissions versus proposed hardening

The SQL preserves the captured effective permissions. It does not include the
separate local application patch that rejects role spelling/case variants.
Remaining source findings are explicit:

- The database owner flag accepts boolean true and string "true" in server-managed
  metadata. The application uses a strict boolean check.
- The database owner permission override accepts unregistered permission names.
- Broad per-owner default ACLs, particularly supabase_admin defaults, remain in the
  capture. Restoring those defaults may require platform authority unavailable to
  a normal hosted postgres connection. Do not skip them or expand live privileges.
- Managed base-schema privileges and HTTP services are not reproduced by a SQL
  fixture, so local success cannot establish their readiness.

Existing application tables deny TRUNCATE/TRIGGER/REFERENCES to client roles in the
local authorization checks. This does not resolve the future-object default-ACL
finding. No proposed security fix is silently mixed into source parity.

## Reproduce and interpret tests

`npm test` includes two fresh PGlite restores, rollback/replay checks and all-six-role
permission tests, forged metadata, cross-user RPC restrictions, organization
isolation and private COA access. Existing application tests remain unchanged.

The disposable workflow uses stock PostgreSQL 17 and runs:

```sh
python3 scripts/check-staging-bootstrap.py --local
python3 scripts/test-staging-replay.py --local-service
```

The runner accepts only its fixed loopback test service or an explicitly labelled,
network-isolated local Docker container (`--container greenlist-baseline-test-NAME`).
It accepts no database URL, clears libpq routing options and requires a fresh
`migration_scratch` PostgreSQL 17 database. Fixture roles are NOLOGIN; the CI
service's fixed throwaway password is not a persistent credential.

Controls include the expected incremental-only failure, missing platform helper,
whole-restore rollback, complete catalog match, missing table/Auth hook, RLS off,
widened grants/default ACLs, exposed bucket, expanded permission, and rejected replay.
Both missing objects and altered definitions fail, rather than passing on counts.
CI artifacts contain check labels and statuses, not SQL bodies or record contents.

The hosted workflow runs only read-only fingerprint queries after the existing
staging-host/routing guard. It compares configuration and catalog metadata, never
application records or function results. It requires a separately approved,
staging-only read-only connection able to read those reference/configuration rows
under RLS. That access is not configured here. Do not substitute a production URL,
service key or a broad BYPASSRLS account. Real-user HTTP/recovery acceptance and
any access-policy changes remain separate approval work.

## Publication and merge boundaries

The capture files and application hardening remain preserved in the prior local
worktree. This branch contains only baseline/validator preparation. It is safe to
review as a draft; it is not a staging release. Main has production deployment
paths, so merging it cannot satisfy the current no-production-deployment condition.
No PR approval, security setting change or hosted mutation is part of this work.
