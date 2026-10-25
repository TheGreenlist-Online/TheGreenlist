# TheGreenlist checks, balances, and controlled exceptions (proposal v1)

Status: proposed; not an authorization to bypass production protections.

## Rule contract
Each rule has a stable ID, owner, threat/goal, scope, required evidence, independent verification, severity, dependencies, expiration/review date, and versioned change history. Report PASS, FAIL, BLOCKED, or WAIVED; never translate a waiver into PASS.

| Rule | Primary check | Independent balance | Gate |
|---|---|---|---|
| R1 Schema | Required tables, columns, indexes, functions and migrations | Fresh isolated database replay + schema diff | Block |
| R2 Authorization | Role-by-operation allow/deny matrix | Negative tests with actual JWT execution roles | Block |
| R3 Privacy | RLS, grants, Storage and API exposure | Cross-tenant adversarial fixtures | Block |
| R4 Compatibility | API integration and browser flows | Production-like staging smoke tests | Block |
| R5 Audit | Required audit writes, append-only semantics | Transaction rollback and audit-event reconciliation | Block |
| R6 Release | Lint, typecheck, unit, integration, migration tests | Protected branch and deployment approvals | Block |
| R7 Exceptions | Validity and scope of exception | Separate approver, expiration, audit trail | Block if invalid |
| R8 Recovery | Backup/restore and rollback runbook | Periodic isolated restore exercise | Block for destructive migrations |

## Dependency behavior
A missing table is a direct R1 FAIL (Postgres 42P01). Dependent tests are BLOCKED with a reference to R1, not falsely PASS. Privilege errors (42501), missing columns (42703), and RLS filtered rows are separately asserted. Log test ID, rule version, commit SHA, migration set, database role, error code, and sanitized evidence; never log credentials or user content.

## Exception control
An exception is a versioned, reviewed record with rule ID, exact scope, justification, risk, owner, independent approver, ticket/PR, compensating controls, start and expiry, and immutable audit evidence. It cannot silently disable the test or rewrite results. Expiration automatically restores the normal gate. The requester cannot approve their own exception. No exceptions for secret exposure, unauthenticated privileged writes, audit tampering, or unverified destructive production migrations. Emergency release follows a separately protected, time-limited human approval process; required platform/branch protections remain enforced.

## Rule changes
Change a rule by PR with old/new contract, tests demonstrating intended behavior, security impact analysis, independent approval, and staging evidence. Do not use a temporary exception to permanently redefine a rule.

## PR #58 acceptance
Keep production unchanged. Validate direct document/audit routes against actual session roles; preserve privileged job logging; verify audit writes and column names; run missing-table, permission, RLS and role-matrix tests in isolated staging. No merge based only on a successful migration unit test.
