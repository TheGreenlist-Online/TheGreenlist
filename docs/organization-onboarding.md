# Organization onboarding

## Merge-readiness review — October 18, 2026

**Hold merge and remote migration promotion.** Review of `f37f112a310fa12df27e1160eb67123368cc8f7e`
confirmed its successful CI/test/build, role-RPC, write-quota and content-workflow
runs, the later owner approval, and no inline review threads. Main subsequently
advanced by four commits to `87dbf56dec8d2798fbfc7b58aa20a8324b190ca5`.
The integration refresh retains both `test` and `test:onboarding`, Next.js and
eslint-config-next 16.4.1, and main's pinned PGlite 0.3.14 with its lockfile.

The review-security patch requires `business.review`, rejects submitter/owner/
membership conflicts, preserves submitted details and writes a transactional audit
record. Isolated tests exercise affiliated reviewers, permission denial, attempted
submission rewrites and rollback when the audit sink rejects a write. These tests
do not establish compatibility with production or satisfy the staging gate.

A temporary Supabase branch provisioned successfully but contained zero public
application tables: `business_profiles`, `profiles`, and `is_reviewer()` were
absent. Consequently it cannot establish compatibility with existing policies,
and the proposed migration was not applied there. The unusable temporary branch
was deleted after inspection. Restore a schema-only baseline from the intended
parent, verify policies/grants/functions/storage parity, and rerun the owner,
admin, editor, viewer, unrelated-user, anonymous and authorized-reviewer matrix
before merging. Synthetic dependency stubs do not satisfy this gate.

Production received no writes or migration deployment. Invitation, verification
UI, public verification synchronization and membership-based editor access remain
unfinished. Any subsequent fixes/integration commits require fresh checks and
review of their new head; the approval and CI above cover `f37f112` only.

## Data model

`business_profiles` stays the public-facing organization record. The new private tables separate access from public identity:

- `organization_memberships` assigns people to an organization with `owner`, `admin`, `editor`, or `viewer` access.
- `organization_verification_requests` records the status and minimal metadata for review. Keep source documents in protected object storage; do not store them in this table.

A database trigger backfills an active `owner` membership for existing records and creates one for every new business profile. The public `owner_id` remains the compatibility root for current business routes.

## Start the rollout

1. Apply the migration to a Supabase development branch. Confirm owner memberships were created for existing profiles and that an organization owner can add an `admin` member but cannot alter or remove the owner row.
2. Add the member-invite UI/API. It must accept an organization ID only after checking `can_manage_organization_members`, never trust an organization ID sent by the client alone.
3. Add a verification submission UI that records legal name and regulator reference, while documents go to protected storage. Reviewers move the request through `submitted`, `in_review`, `needs_information`, `approved`, or `rejected`.
4. Run the claim flow with a test account. Confirm the claimed business automatically has an owner membership, the verification request is private, and reviewer changes are audit logged by the application.
5. Promote the migration after RLS and workflow validation; do not apply it directly to production first.

## Measurement

The business-claim form emits `organization_claim_started` on first input, `organization_claim_attempted` on submission, and `organization_claim_submitted` / `organization_claim_failed` when the request resolves. Neither event carries email, names, organization IDs, or other personal data. Use the events to measure completion and failure rate before expanding invitations.

## Cookie and data handling

Vercel Web Analytics uses anonymized, cookie-free measurements. Do not create a visitor-profile or cookie table for it. Keep only the minimum first-party functional state needed for sign-in, consent, and draft recovery; store a consent version and timestamp if you introduce non-essential tracking. Avoid putting personal information, identifiers, or claim data into analytics event names or event properties.

## Scope and release gates

This is a schema foundation, not a completed invitation or verification UI.
Existing business routes still authorize through `business_profiles.owner_id`;
adding a membership does not grant editor access to those routes yet. Roles on
memberships never grant platform reviewer/admin powers. Owner transfer is not
implemented: do not change `owner_id` without reconciling memberships in the
same reviewed transaction. Invitations currently refer to existing Auth users;
email invitations and acceptance tokens are a separate workflow.

The existing `/api/onboarding` is a GoHighLevel contact integration, not account
provisioning. Keep it separate. Registration is currently invitation-only.
Recommended order: invite/confirm account → create or claim organization → seed
owner membership → submit private verification → human review → invite staff.
Verification-request approval does not automatically update public business
verification status. That needs a separate audited reviewer action.

Run `npm run test:onboarding` for an isolated PostgreSQL execution of the
migration and RLS/guard checks, plus analytics URL-redaction tests. This does
not replace testing against a Supabase development branch with the live
policies, grants, and storage configuration. Test owner, unrelated user, admin,
and reviewer access there before merging. No migration was applied remotely.

Web Analytics custom events require Vercel Pro or Enterprise. Page views and
custom events here are restricted to an explicit set of non-identifying paths;
all query strings and fragments are removed. Private routes, record detail
paths and auth callbacks are excluded. No analytics events are inserted into
Supabase. Blockers and disabled scripts can suppress client events, so use the
transactional database, not analytics, as the authoritative account count.

Auth cookies are credentials: keep Supabase session management as implemented,
never copy tokens or entire Cookie headers into tables/logs/analytics. A cookie
is small browser-held state, not a visitor history database. Persist preferences
as small profile fields where cross-device behavior is needed. If optional
marketing/cross-site trackers are added later, review applicable consent rules
and record policy version, purpose and timestamp separately. Cookie-free
analytics does not by itself establish legal compliance. Define retention and
scheduled deletion for optional event/history data before collecting it.
