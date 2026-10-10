# Enforce durable account quotas on direct Supabase inserts: review handoff

Status: draft proposal, not deployed. Database rollback tests passed against the live schema after PR #33's applied baseline. Tests leave no persistent fixtures.
Merge/record PR #33 first. These branches start from main and do not include each other's patches.

## Codex
Review this PR for authorization bypasses, privacy leaks, RLS recursion, unsafe SECURITY DEFINER logic, direct Supabase calls and migration compatibility. Reproduce the included rollback tests. Return exact file/line findings and concrete fixes. Do not merge or deploy.

## Copilot
Perform an independent code review. Check normal-user flows and service-role/admin behavior, SQL privileges, grants and failure responses. Add missing regression tests on the same branch only after reproducing a gap. Do not introduce service keys into browser code, new dependencies or unrelated changes. Do not merge or deploy.

## Perplexity research prompt
Review the security design in this PR and the current official Supabase, PostgreSQL and PostgREST documentation. Cite primary sources and distinguish verified findings from assumptions. Focus on write-quotas. Identify any incorrect privilege/RLS/trigger/transaction assumption, missing abuse-control layer, or rollout requirement. Do not claim this draft is deployed or secure without test evidence. Use only public code and synthetic examples; do not request or transmit credentials, private reports, evidence files, personal data or raw logs. Return a concise checklist for Codex/Copilot implementation and review.

## Remaining acceptance
- The `Write quota regressions` CI workflow now bootstraps a synthetic disposable PostgreSQL 16 database, applies this migration, runs the existing rejection/recovery/privilege SQL regressions, and runs both HTTP response tests. This fixture is not a full deployed schema or RLS clone. Local replay passed; disabling the report quota trigger caused the expected regression failure, and restoring it passed.
- Reset-time policy remains unresolved: the migration truncates to the database session's hour, with no explicit timezone, while the HTTP response always reports `Retry-After: 3600`. Confirm the canonical reset timezone before changing bucket boundaries or deriving accurate retry timing. This CI change preserves current behavior and does not approve the timing discrepancy.
- Run concurrency tests in staging to verify the atomic counter under concurrent requests. The single-key UPSERT serializes account/action counter updates.
- Check hourly limits against expected launch traffic. These defaults are proposed (reports/tickets 10, threads/documents/education 20, replies 120).
- Add separate read/IP/AI/Storage/Realtime/update/draft controls; this proposal covers successful INSERT rows only.

No production migration or setting change was left applied by this work.
