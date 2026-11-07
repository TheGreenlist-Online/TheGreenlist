# Next release steps

## Verified starting point

The October 18 rollout is complete for its six mapped migrations. A read-only
production check on October 19 UTC confirmed all recorded versions and the
existing private COA migration. `coa_reports` exists; organization memberships
and verification requests do not. Do not replay migrations using `db push` until
history mappings and actual definitions are reconciled.

Content-workflow and write-quota CI already run on main pushes and manual
dispatch. Do not repeat that completed workflow change.

## Ordered execution plan

1. **Inventory and preserve the baseline.** Run
   `supabase/tests/production-release-preflight.sql` against the verified target
   `idtnlninotxwqpznbwur`. Capture definitions/policies and compare with repository
   migrations. This read-only inventory does not establish semantic parity.
2. **Repair PR #29 before merging.** Require `business.review` for review access;
   reject review by the submitter, organization owner or affiliated member;
   preserve submitted legal/registration details; enforce an immutable audit
   record in the same database transaction. Applicant withdrawal must remain
   possible without granting review powers. Add executable negative and positive
   tests, including a moderator without `business.review` and an unrelated
   authorized reviewer. Refresh from main and rerun checks on the new head.
3. **Build representative staging.** Restore schema-only application dependencies
   from the intended parent, including Auth triggers, permission helpers, grants,
   RLS and Storage policies. An empty Supabase branch or synthetic fixture alone
   cannot satisfy the release gate. Apply the proposed migration there and test
   owner/admin/editor/viewer/unrelated/anonymous/reviewer access. Record parity
   evidence and results before promotion.
4. **Validate COA separately.** Keep `COA_INTAKE_ENABLED=false` until staging
   proves authenticated upload, invalid/oversized file rejection, private object
   access, cross-user denial, metadata persistence and rollback/cleanup. Existing
   COA tables do not by themselves establish upload readiness.
5. **Release reviewed changes.** Require fresh CI and review of the exact head,
   apply only missing verified migrations, rerun rollback smoke checks, deploy to
   the canonical `the-greenlist` Vercel project, and test its production routes.
   Enable intake only after its independent validation gate passes.
6. **Follow-up work.** Review remaining SECURITY DEFINER helper exposure and
   leaked-password protection. Investigate duplicate Vercel project failures
   separately; do not delete projects without checking domain/environment use.

## Links

- PR #29: https://github.com/TheGreenlist-Online/TheGreenlist/pull/29
- PR files: https://github.com/TheGreenlist-Online/TheGreenlist/pull/29/files
- Actions: https://github.com/TheGreenlist-Online/TheGreenlist/actions
- Supabase: https://supabase.com/dashboard/project/idtnlninotxwqpznbwur
- Canonical Vercel project: https://vercel.com/the-greenlist-online/the-greenlist

This change starts step 1 with a reusable read-only preflight. It does not fix
PR #29, provision staging, apply production migrations or enable intake.
