# Production migration rollout — October 18, 2026

Target: TheGreenlist, Supabase project `idtnlninotxwqpznbwur`.
Repository baseline: main `87dbf56dec8d2798fbfc7b58aa20a8324b190ca5`.
Times below use the UTC migration versions; the rollout occurred October 18 in
America/Los_Angeles.

## Applied and verified

| Repository migration | Recorded production version |
| --- | --- |
| `20260928000000_add_correction_workflow.sql` | `20261019035906` |
| `20261006234128_enforce_client_write_quotas.sql` | `20261019035642` |
| `20261006234138_restrict_cross_user_role_rpc.sql` | `20261019035650` |
| `20261006234146_guard_content_review_fields.sql` | `20261019035830` |
| `20261019040103_fix_profile_role_audit_uuid.sql` | `20261019040232` |
| `20261019040245_align_permission_role_comparison.sql` | `20261019040314` |

The Supabase migration API assigns deployment-time versions. These entries map
to the repository files above; the historical versions were not rewritten or
marked applied without execution. Do not blindly replay the directory with
`db push`: several older production changes also have different history versions.
Inspect definitions and the recorded statements before any migration-history
reconciliation.

The existing `20261017202824_private_coa_intake` was already applied. Production
has `coa_reports` with RLS; organization memberships and verification requests
from unmerged PR #29 were not deployed. No intake feature flag was enabled.
Existing claim-owner policies, business-review protection, notification triggers,
and automation-job access policies were inspected rather than unnecessarily
reapplied. Client TRUNCATE/TRIGGER/REFERENCES grants were absent.

## Compatibility fixes found by live verification

- `private.protect_profile_authority()` cast `NEW.id` to text when writing a UUID
  `audit_logs.entity_id`. Legitimate owner-authorized role changes failed. The
  replacement preserves the guard and writes the UUID directly.
- Production's `current_platform_role()` returns text, whereas
  `role_permissions.role` is an enum. `has_permission()` failed at execution.
  Explicit text comparison supports both that deployed helper and the
  repository's enum-returning helper, retaining the same permission predicate.

Both fixes have executable PostgreSQL unit coverage. The production smoke file
uses actual Auth/profile triggers, tables, RLS and permission helpers, with random
synthetic identities and a mandatory rollback. Its successful run verified:

- Profile role assignment and UUID audit writes through the existing guard.
- Self-only ordinary role lookup and denied anonymous role RPC execution.
- Ten accepted report inserts and rejection of the eleventh, using correction
  requests to exercise the expanded report-type constraint.
- Ordinary forum reply, denied self-moderation and denied locked-thread reply.
- Denied moderator business-document review; authorized moderator forum review
  through the audited RPC.
- Authorized administrator review of an unrelated document, denied submission
  rewriting and denied self-review, with audit records for accepted decisions.
- Private quota counters and cleaned-up moderation capabilities.

All synthetic writes rolled back; a follow-up count found zero smoke accounts.
No real user role, report, business or evidence object was changed by the tests.

## Workflow correction and boundaries

Content-security and write-quota regressions previously ran only on matching PR
changes. They now also run on every push to main and support manual dispatch.
Existing CI keeps its ordinary test/build jobs and the separate role-RPC checks.

Security advisors still report public/self-scoped SECURITY DEFINER helpers and
disabled leaked-password protection. The new private quota/context tables have
RLS with no client policies deliberately, and client grants are revoked. These
advisor notices are not a claim that the platform has no remaining security work.

PR #29's self-review, submission-integrity, permission, audit and staging-baseline
requirements remain a separate release gate. No invitation or organization
verification workflow is enabled by this rollout.
