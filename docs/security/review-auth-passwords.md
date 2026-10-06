# Add a verification runbook for compromised-password protection: review handoff

Status: draft proposal, not deployed. Hosted setting remains pending; this PR supplies the operational runbook only.
Merge/record PR #33 first. These branches start from main and do not include each other's patches.

## Codex
Review this PR for authorization bypasses, privacy leaks, RLS recursion, unsafe SECURITY DEFINER logic, direct Supabase calls and migration compatibility. Reproduce the included rollback tests. Return exact file/line findings and concrete fixes. Do not merge or deploy.

## Copilot
Perform an independent code review. Check normal-user flows and service-role/admin behavior, SQL privileges, grants and failure responses. Add missing regression tests on the same branch only after reproducing a gap. Do not introduce service keys into browser code, new dependencies or unrelated changes. Do not merge or deploy.

## Perplexity research prompt
Review the security design in this PR and the current official Supabase, PostgreSQL and PostgREST documentation. Cite primary sources and distinguish verified findings from assumptions. Focus on auth-passwords. Identify any incorrect privilege/RLS/trigger/transaction assumption, missing abuse-control layer, or rollout requirement. Do not claim this draft is deployed or secure without test evidence. Use only public code and synthetic examples; do not request or transmit credentials, private reports, evidence files, personal data or raw logs. Return a concise checklist for Codex/Copilot implementation and review.

## Remaining acceptance
- Enable the hosted setting and collect redacted verification evidence before claiming remediation complete.

No production migration or setting change was left applied by this work.
