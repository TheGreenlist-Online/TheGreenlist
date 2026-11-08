# Hardened staging completion candidate

Status: prepared and tested locally, **not applied to hosted staging**. This does
not make PR #60 merge-ready and does not remove or bypass the live acceptance gate.

## Scope and safeguards

The compiler accepts only project `otmaxtjstvbfckpgbwdi` and first verifies the
closed foundation's exact recorded fingerprint. The actual migration tool must
also select that exact project; a SQL database name/version is not a project ID.
No production database operation, credential, role membership, default-ACL change,
historical migration replay, or customer-data copy is included.

The candidate adds the missing 36 routines, invoker compatibility view, 22 custom
triggers, application RLS event trigger, 93 policies, four private buckets and
comments. Existing tables, indexes, constraints and role-reference rows are not
recreated. The platform's existing public namespace ACL is retained exactly.

The following hardening is applied within the same atomic server statement before
any grants can become visible to other sessions:

- Owner authority requires JSON boolean true in live server-managed account data.
- Permission checks reject unregistered and null permissions even for an owner.
- Profile policies consult live owner authority, not stale JWT owner claims.
- PUBLIC receives no application routine execution rights. Existing named API-role
  grants remain where required; trigger routines are not client-callable.
- Clients receive no MAINTAIN, TRUNCATE, REFERENCES or TRIGGER table privileges.
- All 30 application tables retain FORCE RLS.

The original captured snapshot and fingerprints remain unchanged. A reviewed
hardened fingerprint and real hosted acceptance evidence are needed for the next
gate version; do not overwrite archival expectations to make a check pass.

## Verification so far

Six focused tests pass, including all six platform roles, strict owner metadata,
stale/revoked/forged claims, cross-user profile edits, object-identity preservation,
unchanged default ACLs, rollback, injected late privilege regression, changed
precondition rejection and replay rejection. The complete JavaScript suite has
53 passing tests; 12 Python tests pass. Typecheck passes, and lint reports zero
errors and three existing warnings.

Local tests use PGlite's fixed `template1` database name and a disposable fixture
whose public namespace ACL matches the observed hosted state. Those adaptations
exist only in tests, not in the generated hosted candidate.

The reviewed generated candidate is 171445 bytes, SHA-256
`da647d081bf666a7b38b2e6bf2d8b28a0a62b1470720adc20038b301771e9eb4`.
It is generated with `scripts/build-staging-completion.py`. The bare generated
statement commits if successful. A rollback-only hosted compatibility probe must
instead raise its unique sentinel inside the outer DO after every assertion, and
then independently confirm that the closed fingerprint remains unchanged. The later
hosted compatibility probe has an unverified outcome. A follow-up read confirmed
the closed foundation remained, but did not establish whether the probe executed
and rolled back or never started. Do not count this as a pass or retry it blindly.
This uncertainty is separate from the successful original foundation rollback.

## Remaining connection and release work

The latest checked head before this candidate was
`0d2ce2d4bfc63cfdf2dfa02b342b5f9c8cffc4c4`. Its build, regressions, provenance and
disposable PostgreSQL replay passed. The live gate failed because the
`STAGING_DATABASE_URL` Actions secret was absent. No staging validator role existed
in the last read-only inspection.

A GitHub reconnection is not needed to add a staging database. The credential
belongs in this repository's Settings > Secrets and variables > Actions, under
`STAGING_DATABASE_URL`, after a dedicated staging-only identity is securely
provisioned. Never use a production, postgres/admin or service-role credential.
Never put a database password or connection string in a PR, document or chat.
Credential creation and persistent access must receive their own approval.

The validator must not inherit application roles or callable mutating PUBLIC
routines. NOINHERIT and default_transaction_read_only alone do not make it safe.
Review effective catalog/extension/schema privileges and use a narrow checksum
interface or narrowly scoped reference/configuration reads. Test denied DML,
forged JWT settings, role switching, privileged RPCs and direct Auth/Storage reads.

Adding the secret alone is insufficient: the current gate still ends with
BLOCKED_HOSTED_ACCEPTANCE because real signed-JWT/Auth/Storage and recovery checks
are not implemented. Complete and run those checks with approved synthetic inputs,
review the hardened schema, then require all exact-head checks before merging.
The user's merge request permits its ordinary application deployment side effect;
production database changes remain outside this staging work.

## Credential-free connection preparation

The workflow now calls a separately tested URL guard. Session-pooler behavior is
prepared using synthetic `.invalid` endpoints, but the approved hosted pooler
configuration remains empty. No real pooler, validator role or credential is
enabled by this change. See the [validator access and negative-test plan](staging-validator-access-plan.md)
for the remaining review and secure provisioning steps.
