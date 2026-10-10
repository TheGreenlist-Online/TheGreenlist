# Guard document approvals and forum moderation: review handoff

Status: ready for review, not deployed or accepted for merge. PR #33 has merged into main (`b1d1ccd`); its already-applied database and role-helper repairs remain the required staging baseline. This branch does not duplicate #33's patches. The October 10 revision used only repository reads and disposable local PostgreSQL, with no production database access or deployment.

## Authorization contract

- Preserve commit `62bc254`'s business-document guard and regressions: `business.review` is required; business owners and uploaders cannot review their own documents. Trusted document service-role writes remain supported.
- Every untrusted document write requires a non-null `auth.uid()` before any submission/reviewer path. Reviewer INSERT/UPDATE statuses must be `pending_review`, `approved`, or `rejected` (NULL/unknown values raise `22023`). This is the stored vocabulary in the document API; its PATCH endpoint currently exposes only approved/rejected decisions. Review-only column restrictions and self-review denial remain unchanged.
- Accepted document review INSERTs and changes to status or review_note write `business_document.review` to the existing protected `audit_logs` sink in the same transaction. A private AFTER trigger records the authenticated reviewer, document ID, operation, and before/after status and review_note only. Audit failure rolls back the document write. Pending submissions, no-op updates, and the existing trusted service/maintenance imports do not create review events. The document authorization guard remains SECURITY INVOKER; the audit helper has an empty search path and no client EXECUTE grants.
- Untrusted forum INSERTs overwrite `id`, `created_at`, and `updated_at` with `gen_random_uuid()` and transaction `now()`, for both threads and replies, including reviewer-authors. Both application insertion routes omit these fields and consume returned rows. Explicit database maintenance retains imported metadata; forum service-role callers still have no actorless bypass.
- Forum reviewers are ordinary authors when submitting or editing their own content. They cannot change status, risk, lock, pin, summary, identity, or placement on their own submissions, including through the moderation RPC.
- Direct moderation-field writes are rejected. Call `public.moderate_forum_content(p_target_type, p_target_id, p_changes, p_reason)` using the authenticated session client. `p_target_type` is `thread` or `post`; changes may include `status` and `risk_level`, plus thread-only `is_locked`, `is_pinned`, and `ai_summary`. A nonblank reason of at most 2,000 characters is mandatory. This is a database moderation workflow; it does not wire new forum moderation controls into the queue UI.
- The RPC checks `moderation.review`, derives the actor from `auth.uid()`, rejects self-moderation and inaccessible/private/inactive parent forums, and locks the target before updating. Neither a supplied actor nor editable JWT user metadata grants authority. The read-only production catalog on October 8 confirms MODERATOR/ADMIN have `moderation.review`, and only ADMIN has `business.review`; the existing platform-owner helper remains authoritative.
- A private, RLS-enabled transaction capability permits only the RPC's protected-field mutation. It is not an exposed schema or a caller-settable GUC. Authenticated clients and service-role clients cannot write it. The RPC and private guard use an empty search path. No new broad reviewer RLS policies or table grants are introduced.
- The decision and `audit_logs` insert are in one transaction. The live audit columns are `entity_type`/`entity_id`, not `target_type`/`target_id`. Audit metadata includes reason and before/after moderation fields, without copying bodies or author identity. Audit failure rolls back the decision. Database maintenance roles retain their explicit migration/fixture exemption; application forum service-role writes have no early-return exemption.
- Ordinary reply inserts and edits, including reviewer-authored writes, must pass accessible/published/unlocked parent checks under `FOR SHARE` and the 50,000-character body limit. Audited moderation-only updates may hide/restore existing posts on locked or removed threads; they cannot add replies, rewrite bodies, or relocate content. This intentional exception permits moderation of already-locked content.
- The reply API maps SQLSTATE `42501` after a stale unlocked pre-check to HTTP 403 and `22001` to HTTP 400; unrelated failures remain 500. Author edits and normal default-published submissions remain supported.

Example authenticated Supabase call:

```ts
await supabase.rpc('moderate_forum_content', {
  p_target_type: 'thread',
  p_target_id: threadId,
  p_changes: { is_locked: true },
  p_reason: 'Human-reviewed lock: personal information requires removal',
})
```

## Verification

October 10 revision: PostgreSQL 16 fixture bootstrap, migration application, expanded rollback regression, and both two-session lock orderings passed locally. Repository lint passed with three existing warnings; all six reply-handler tests, TypeScript, application build, and diff checks passed. `npm run check:roles` explicitly skipped because Supabase URL/service-role credentials were absent; it is not a passing live role-sync check.

The document-audit follow-up also passed the full PostgreSQL 16 suite and both concurrency orderings, six handler tests, lint (three existing warnings), TypeScript, and build. Four additional negative controls failed as expected: missing table trigger, wrong actor attribution, extra submission metadata, and swallowed audit failure. Tests verify approve/reject/reset and note-only snapshots, reviewer INSERTs, no-op/submission/import exemptions, protected audit privileges, and atomic INSERT/UPDATE rollback.

Repository and main-branch searches found no separate document audit trigger. The workspace has no complete deployed catalog snapshot, so absence on the deployed baseline remains unverified. Before applying this migration, inspect the isolated staging baseline for overlapping audit triggers to avoid duplicate events.

Seven negative controls failed as expected: removing the document actor check, moving it only into the submission fast path, removing document status validation, omitting its explicit NULL check, and individually removing each forum identity/timestamp assignment. Restoring the fixes passed the full SQL suite. New regressions cover valid reviewer transitions and invalid INSERT/UPDATE values, actorless requests, ordinary/admin/moderator forum identities, returned-ID parent references and edits, and trusted document/maintenance imports.

The NULL-actor tests deliberately grant access to a temporary trigger-only document fixture. They establish a trigger defect, **not anonymous production reachability**. The repository does not contain a complete current business-document grants/RLS baseline; production grants and policies were not queried in this revision. Existing grant-hardening migrations leave DML grants in place but do not establish the effective document INSERT policies. Confirm both layers on staging before making a reachability claim. The reported main-preview migration-history mismatch is a separate, pre-existing integration issue; this fixture run neither reproduces nor repairs it.

This updates the existing, explicitly undeployed PR migration, following this PR's revision convention. No new migration/version or production SQL application is introduced.

Passed locally: the expanded SQL rollback regression on disposable PGlite PostgreSQL, all six actual reply-handler tests (`npm test`), TypeScript (`npx tsc --noEmit --incremental false`), focused ESLint, and `git diff --check`. The fixture mirrors inspected forum policies/columns and uses the production permission-helper shape, but is not a full production schema clone. Existing document regression cases are preserved. Tests exercise both ADMIN/MODERATOR author scenarios, direct locked/private/removed-thread writes, length bounds, self-moderation through the RPC, forged editable metadata, blocked capability writes, valid unlock/remove/restore decisions, audit snapshots, and atomic rollback on audit failure.

The `Content workflow security` GitHub workflow uses a disposable PostgreSQL 16 service, applies the proposed migration, runs rollback regressions, and runs `scripts/test-forum-locks.py`. It asserts a database lock wait in both orders: lock-first rejects a reply after commit; reply-first commits before the lock. Do not run the fixture bootstrap or concurrency fixture script on a real project.

Reproduce in a new disposable PostgreSQL database (standard PG* connection variables):

```sh
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/content-workflows-fixture.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/migrations/20261006234146_guard_content_review_fields.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/content-workflows.sql
python3 scripts/test-forum-locks.py
npm test
```

## Fresh Codex and Copilot review

Review the new head for direct Supabase authorization bypasses, capability forgery/leaks, self-moderation, RPC grants, role-helper compatibility, audit rollback, private-content access, and concurrent lock/reply ordering. Reproduce the rollback and API tests. Verify moderation-only locked-thread updates are narrow. Preserve the completed business-document fix. Return concrete findings; do not merge or deploy.

## Remaining acceptance

- Require passing PostgreSQL CI, including the two-session lock test, and fresh Codex/Copilot reviews.
- Replay against an isolated staging clone including #33's baseline and existing triggers, grants, constraints, and search-vector logic; inspect advisors there.
- Verify owner uploads, unrelated ADMIN document reviews, authenticated moderation RPC calls, and reply failures through real staging Supabase/PostgREST requests.
- PR #39 is ready for review under the later readiness authorization; merge approval and deployment acceptance remain pending. Do not apply its migration to production until these checks are verified.
- File URL/type/size validation, anonymous forum read projections, moderation-queue field guards, and existing unrelated API audit-column mismatches remain separate work.
