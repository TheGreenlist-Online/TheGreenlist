# Closed staging foundation

This is a separate, deliberately incomplete preparation step for isolated project
`otmaxtjstvbfckpgbwdi`. It is not the captured full baseline, application activation,
security acceptance, or a way around the existing fail-closed release gate.
Production `idtnlninotxwqpznbwur` is not a target. No production data is copied.

## Included

- 28 public and two private tables, three enums, 127 constraints and 101 indexes.
- Six role catalog rows and 42 permission mappings, with no identities assigned.
- RLS enabled and forced on all 30 tables, zero RLS policies.
- All newly inherited table privileges revoked from PUBLIC, anon, authenticated
  and service_role in the same transaction before commit. No application roles
  receive table access, even service_role, which otherwise bypasses RLS.

## Deliberately excluded

Application routines, including the owner override; compatibility view; custom
Auth hooks; application triggers; event triggers; Storage policies/buckets;
credentials; role memberships; changes to managed/default ACLs; customer content.
The application cannot operate against this closed foundation yet.

The compiler selects exact hash-pinned structural/reference phases from PR #60
commit `6bb106de03806fc9cbf961c19fb18904bd96c6e0`. It stops at reviewed view and bucket
boundaries. It never executes database commands or accepts a database URL.

## Application and verification

Generate SQL with `python3 scripts/build-closed-staging-bootstrap.py --target
otmaxtjstvbfckpgbwdi --output /tmp/closed-staging-foundation.sql`. The operator must
verify the actual Supabase project identity separately and apply the entire output
through that project's migration API. The generated SQL is one server-side DO
statement, so a late failure rolls back all changes even with client autocommit.
The SQL asserts a
PostgreSQL 17 postgres connection, empty application schemas, zero Auth/Storage
data, and no conflicting custom Auth/Storage objects. Any mismatch must abort.

The final assertions check table access, forced RLS, the complete structural
inventory, allowed reference-row counts, and unchanged database roles, managed
schemas, default ACLs, managed policies and managed triggers. Tests compare every application
table column definition and the captured constraint/index/configuration
fingerprints, then check rollback, replay rejection and denied client access.

## Next stage remains blocked

The original baseline's hosted review and release gates stay unchanged and blocked.
Do not replay the full snapshot over these tables, drop the tables to get around
its empty-schema guard, or replay the historical migration chain. A subsequent
reviewed completion migration must first verify this closed foundation and then
add only reconciled, tested application objects. Owner semantics, default ACLs,
real Auth/JWT and Storage tests, and recovery acceptance remain separate work.
No readiness or production deployment is implied by creating the tables.

## Executed November 6, 2026

Applied to isolated staging through the Supabase migration API at approximately
21:17 UTC. Recorded migration: `20261106211724 closed_staging_foundation`.
The generated 58,584-byte SQL artifact SHA-256 is
`996f482908b775aecb35e5b0d70c2da97b11184d65f1fb7492847215cbd6816b`.

Before committing, the identical payload ran successfully through all assertions
and then deliberately raised `CLOSED_FOUNDATION_ROLLBACK_PROBE`. Separate reads
confirmed zero application tables/enums/routines, no private schema, no Auth/Storage
data and no migration entry after that rollback. The actual application then
succeeded, and separate reads verified the inventory and zero effective API/service
role privileges. Constraint, index and reference-data fingerprints match the
captured baseline exactly. The complete resulting metadata fingerprint is retained
in `supabase/bootstrap/closed-staging/applied-fingerprint.json`.

All 47 JavaScript tests and 12 existing Python tests passed, including local
restore/rollback/replay and access-denial checks. TypeScript passed. Lint passed
with three existing warnings and zero errors. PGlite uses database `template1`, so
closed-foundation tests adapt only that database-name comparison; a separate test
proves the unmodified hosted artifact rejects it. The hosted rollback probe tested
the unmodified payload against the real PostgreSQL 17 staging platform.

The security advisor reports only 30 informational `RLS Enabled No Policy`
findings, which are expected for this intentionally closed state. See
https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy.
No production operation, secret creation, privilege elevation, default ACL change,
full-baseline gate change, application activation or production deployment occurred.
