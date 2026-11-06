# Staging bootstrap acceptance matrix

Status: BLOCKED. This document is an audit plan, not authorization to restore or merge.

## Verified on 2026-10-28
- Staging `otmaxtjstvbfckpgbwdi`: zero public application tables and zero recorded migrations (read-only Supabase connector).
- Production `idtnlninotxwqpznbwur`: 28 public and 2 private application tables; all 30 have RLS enabled (read-only catalog query).
- Production organization memberships and verification requests exist and have authenticated policies; existence is not evidence PR #29 matches live definitions.
- PR #60 remains a draft, intentionally fails closed, and contains no schema bootstrap.

## Required source of truth
1. Pin production schema snapshot timestamp, repository SHA, extension versions and schema ownership. Capture schema-only definitions without copying rows, Auth users, credentials, COA evidence or Storage objects.
2. Reconcile organization membership and verification definitions against PR #29: columns, constraints, indexes, triggers, function bodies, SECURITY DEFINER search_path, RLS policies, grants and default privileges.
3. Capture `public` and `private` schema definitions, custom Auth triggers/functions and Storage policies. Recreate bucket configuration separately using reviewed non-sensitive metadata.
4. Prove the bootstrap on a disposable isolated database first. Never replay all migrations blindly or insert fictitious migration history.

## Distinct CI outcomes
- BLOCKED_CONNECTION: missing secret, rejected hostname/options, DNS/TLS/auth/connectivity failure. No database readiness assertion.
- FAIL_SCHEMA: missing expected schemas, relations, types, functions, triggers, constraints or Storage configuration.
- FAIL_MIGRATION: incompatible incremental migration, duplicate/conflicting definition or non-repeatable rebuild.
- FAIL_AUTHORIZATION: forbidden action succeeds, required action denied, cross-tenant access, role confusion, RLS or grant mismatch.
- FAIL_RECOVERY: restore/replay/rollback drill fails or cannot prove isolation.
- PASS: schema semantic parity, migration replay, real JWT and Storage HTTP tests, recovery checks, isolation and required approvals all pass.

## Authorization matrix to implement
For every platform role and organization membership role, test self versus unrelated actor, anonymous versus authenticated, owner versus editor/viewer, permitted reviewer versus unrelated reviewer, and privilege escalation attempts. Assert both allow and deny cases. Test `business.review` explicitly; never infer platform authorization from matching role display names. Test direct SQL grants and HTTP APIs separately. Verify Auth user creation trigger and private COA bucket (PDF-only, 3 MiB) with synthetic documents.

## Release controls
Keep PR #60 draft and fail-closed. Keep COA intake disabled. Use a dedicated read-only staging CI connection with exact-host guard, separate from restricted bootstrap credentials. No production writes, no user-data copying, no service-role key in client code. Require evidence artifacts and explicit security/release approval before merge.
