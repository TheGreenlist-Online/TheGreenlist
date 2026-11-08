# Staging validator access and negative-test plan

Status: **design only; no validator identity or hosted permissions provisioned**.
This plan does not establish hosted acceptance or authorize an access change.
Target: staging `otmaxtjstvbfckpgbwdi`. Production is excluded.

## Connection preparation

`scripts/staging-url-guard.py` is the workflow's single routing validator. Direct
connections remain restricted to `db.otmaxtjstvbfckpgbwdi.supabase.co`, database
`postgres`, and port 5432 or its default. Session-pooler logic is exercised only
with `.invalid` endpoints and synthetic credentials. `APPROVED_SESSION_POOLER`
remains `None`: the workflow still rejects every pooler URL.

Before enabling a pooler endpoint:

1. Obtain its exact hostname and session port from the staging project's Connect
   dialog. Do not infer the hostname from the region or allow a provider suffix.
2. Review and provision a dedicated validator identity through the approved secure
   process. Do not use `postgres`, managed Supabase roles, application roles,
   service-role API keys, or production credentials.
3. Pin the exact hostname and dedicated role in a reviewed code change. The pooler
   username must be exactly `<validator-role>.otmaxtjstvbfckpgbwdi`, port 5432 and
   database `postgres`. A shared hostname alone does not identify a project.
4. Exercise the real connection and grants in isolated staging; synthetic URL
   tests prove parser behavior, not connectivity or authority.
5. Only then store its URI directly in the repository's Actions secret
   `STAGING_DATABASE_URL`. Never put the URI in chat, code, artifacts or logs.

The guard accepts only an absent query string, `sslmode=require`, or
`sslmode=verify-full`. Percent-encode reserved password characters; raw password
characters are limited to URI-unreserved characters. Routing/service/options
parameters, encoded query names, duplicates, fragments, control characters and
ambiguous authorities are rejected. The workflow clears inherited `PG*` settings
before `psql`. Encrypted transport with `require` is not server identity
verification; `verify-full` requires a separately reviewed certificate setup.

Supabase documents direct connections as IPv6 unless its IPv4 add-on is enabled,
and the session pooler as IPv4-compatible. The project's actual endpoint and
runner reachability still need verification. Do not purchase an add-on or change
network settings merely to complete this preparation.

Sources: [Supabase connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres),
[GitHub repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Least-privilege design to review

The existing fingerprint query reads PostgreSQL catalogs, two role-reference
tables and selected bucket configuration. It is not enough to create a login with
`NOINHERIT` or `default_transaction_read_only`: those settings do not remove
PUBLIC privileges, callable privileged routines, role-switch rights or overrideable
session settings.

Prefer a small, reviewed interface that returns only the fixed fingerprint keys,
counts and digests. A private schema and exact function signature should prevent
clients from discovering a new public RPC. Do not expose arbitrary SQL, table
names, actor IDs, tenant IDs, search paths or other caller-selected scope. If a
SECURITY DEFINER function is necessary, its owner must be a dedicated NOLOGIN role
with only the underlying reads needed, a fixed safe search path and schema-qualified
objects. Revoke default PUBLIC execution before commit and grant only the exact
entrypoint to the validator. Review RLS and FORCE RLS behavior without introducing
BYPASSRLS or broad `pg_read_all_data` membership. This is a design candidate, not
an instruction to install that function or an assurance it is feasible unchanged.

An alternative is explicit, narrow configuration reads and matching RLS policies.
Compare its exposure and maintenance cost before choosing. In either design:

- No superuser, CREATEDB, CREATEROLE, REPLICATION, BYPASSRLS, application-role
  membership, role administration, schema ownership, schema CREATE or object writes.
- No direct reads of Auth users/sessions, Storage objects, application profiles,
  evidence, audit records or customer content. Bucket configuration is not object data.
- Inspect effective PUBLIC and extension privileges, not just direct grants.
  Do not weaken platform-wide defaults to make a test pass. If inherited PUBLIC
  privileges prevent isolation, treat that as a design blocker, not something
  that a read-only session default can repair.
- Distinguish platform information inherently visible to PostgreSQL logins from
  extra privileges granted by this plan; do not promise zero catalog visibility.

## Executable negative tests to implement before provisioning

Use a disposable PostgreSQL 17 fixture first. Check that the test login really is
non-owner and not superuser; a test that silently runs as `postgres` is invalid.
Capture `session_user`, `current_user` and an approved identity assertion privately,
then publish only pass/fail labels. Connect with the actual validator credential
for hosted verification, not with an admin followed by `SET ROLE` alone.

| Test | Required outcome |
| --- | --- |
| Approved fixed fingerprint read | Returns only the documented keys, counts and digests; deterministic for the same catalog. |
| Altered catalog/configuration in disposable fixture | Comparator fails without printing definitions or records. |
| SELECT on profiles, evidence, audit data, `auth.users`, Auth sessions and `storage.objects` | Permission denial, or an explicitly reviewed zero-row RLS result; no data returned. |
| INSERT, UPDATE, DELETE, TRUNCATE, CREATE, ALTER and DROP against fixture objects | Denied by effective privileges independently of read-only session settings. |
| Set read-only mode off, then repeat denied operations | Still denied; configurable session defaults are not the authority boundary. |
| SET ROLE to postgres, service_role, authenticated, anon and privileged predefined/managed roles | Denied; membership graph has no escalation path. |
| Set forged owner/admin JWT GUCs, then repeat protected reads/writes/RPCs | No new capability; fake claim settings cannot supply authority. |
| Call mutating SECURITY DEFINER, trigger helpers and extension entrypoints | Denied unless an exact reviewed harmless operation is necessary; no side effects. |
| Caller-controlled function args/search_path or shadow object attempts | Rejected or ineffective; no alternative object resolution. |
| Invoke checksum interface as anon/authenticated/PUBLIC/unrelated login | Denied. |
| Future application function/table created in fixture | Validator gains no unexpected EXECUTE/SELECT/write privileges through defaults. |
| Role/login reconnect and repeated runs | Same restricted authority; no pooled session-state leakage. |
| Failure diagnostics and evidence artifacts | No URL, password, tokens, raw records, SQL definitions or server error detail containing secrets. |

Every destructive or privilege-regression injection above belongs in the disposable
fixture. Do not run destructive negative tests against hosted objects and rely on
rollback for safety. After approval, the hosted verification should use catalog
privilege assertions and deliberately bounded synthetic fixtures, with independently
verified cleanup. Stop on an unexpected success, retain sanitized evidence, and
require a fresh review before granting more access.

The current security-schema rollback probe remains unverified. An unchanged hosted
fingerprint cannot distinguish a completed rollback from a test that never started.
Do not retry that probe as a side effect of implementing these local tests.

## Release evidence remains separate

Passing URL or validator-permission tests does not pass real Auth/JWT, Storage HTTP
isolation, application authorization or recovery acceptance. Keep the final
`BLOCKED_HOSTED_ACCEPTANCE` gate and PR #60's draft status until those checks are
implemented, executed and reviewed on the intended commit. Preserve the captured
baseline fingerprint; review intentional hardening differences separately.
