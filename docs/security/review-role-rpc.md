# Restrict cross-account privileged role lookup RPC: review handoff

Status: ready for review, not deployed. PR #33 is merged. The original handoff recorded rollback tests against the live schema; the 2026-10-10 follow-up uses only a disposable local database. These branches do not include each other's patches.

## Codex
Review this PR for authorization bypasses, privacy leaks, RLS recursion, unsafe SECURITY DEFINER logic, direct Supabase calls and migration compatibility. Reproduce the included rollback tests. Return exact file/line findings and concrete fixes. Do not merge or deploy.

## Copilot
Perform an independent code review. Check normal-user flows and service-role/admin behavior, SQL privileges, grants and failure responses. Add missing regression tests on the same branch only after reproducing a gap. Do not introduce service keys into browser code, new dependencies or unrelated changes. Do not merge or deploy.

## Perplexity research prompt
Review the security design in this PR and the current official Supabase, PostgreSQL and PostgREST documentation. Cite primary sources and distinguish verified findings from assumptions. Focus on role-rpc. Identify any incorrect privilege/RLS/trigger/transaction assumption, missing abuse-control layer, or rollout requirement. Do not claim this draft is deployed or secure without test evidence. Use only public code and synthetic examples; do not request or transmit credentials, private reports, evidence files, personal data or raw logs. Return a concise checklist for Codex/Copilot implementation and review.

## Remaining acceptance
- Verify reviewer policies and platform-owner operations against main plus PR #33.
- Inventory the remaining intentional permission helpers rather than blanket-revoking them.

No production migration or setting change was left applied by this work.

## 2026-10-10 regression follow-up

PR #33 is merged. This follow-up changes tests and CI only; it does not change
RPC behavior or apply a hosted migration. `role-rpc.yml` runs PostgreSQL 16 with
a minimal synthetic fixture, the actual PR migration, and rollback assertions.
Coverage includes ordinary self/cross-account access, anonymous EXECUTE denial,
subjectless service JWTs, direct service sessions without claims, missing users,
signed-out authenticated requests, and authorized administrator lookups.

Local verification: PostgreSQL 16 assertions pass. Three negative controls fail as
expected when the service-role path, missing-actor guard, or cross-account guard
is removed; restoring the actual migration passes again.

The fixture is a contract test, not proof of deployed grants or a full migration
replay. Staging PostgREST requests, actual reviewer/platform-owner policies,
permission-helper inventory, and advisor acceptance remain unrun. Never run the
fixture against an existing Supabase project.
