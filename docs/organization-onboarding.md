# Organization onboarding

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

The business-claim form emits two Web Analytics custom events only after submission resolves: `organization_claim_submitted` and `organization_claim_failed`. Neither event carries email, names, organization IDs, or other personal data. Use the events to measure completion and failure rate before expanding invitations.

## Cookie and data handling

Vercel Web Analytics uses anonymized, cookie-free measurements. Do not create a visitor-profile or cookie table for it. Keep only the minimum first-party functional state needed for sign-in, consent, and draft recovery; store a consent version and timestamp if you introduce non-essential tracking. Avoid putting personal information, identifiers, or claim data into analytics event names or event properties.
