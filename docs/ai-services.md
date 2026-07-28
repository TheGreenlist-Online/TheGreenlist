# AI Services

How AI works on The Green List: what it is allowed to do, what enforces that, and how to operate it.

The governing principle is in `AGENTS.md`: **AI assists, humans decide.** No AI code path in this
repository mutates a platform record. Every endpoint returns a recommendation, a summary, or a set of
links.

---

## 1. Architecture

```
src/app/api/ai/<feature>/route.ts   thin: describe the request, build the input
        │
        ▼
src/lib/ai/route-handler.ts         authz → rate limit → body parse → run → audit → respond
        │
        ▼
src/lib/ai/run.ts                   one Responses API call + bounded tool loop + strict validation
        │                                   │
        │                                   ▼
        │                           src/lib/ai/tools/*   Zod-validated, per-feature allow-listed
        ▼
src/lib/ai/audit.ts                 metadata-only row in public.ai_audit_logs
```

Routes never import the OpenAI SDK. `src/lib/ai/client.ts` is the only module that reads
`OPENAI_API_KEY`, and it throws if it is ever evaluated in a browser bundle.

| Module | Responsibility |
| --- | --- |
| `config.ts` | Env parsing and feature flags. Never throws — build runs without secrets. |
| `client.ts` | The single `OPENAI_API_KEY` read. `assertServerOnly()` guard. |
| `errors.ts` | `AiError` + code→HTTP-status map + `redact()` for logs. |
| `permissions.ts` | Who may call what, and the per-tier daily allowance. |
| `rate-limit.ts` | Burst + daily counters. Swappable via `setRateLimiter()`. |
| `prompts.ts` | System prompts and `asUntrustedContent()` framing. |
| `schemas.ts` | Zod request/output schemas and JSON Schema conversion. |
| `tools/` | The only way the model touches the database. |
| `run.ts` | Orchestration, tool loop, output validation. |
| `route-handler.ts` | The pipeline every route shares. |
| `audit.ts` | Metadata-only audit writes. |

---

## 2. Endpoints

All live under `/api/ai/`. `GET` returns `{ enabled, feature }` so a client can hide a feature it
cannot use. `POST` performs the request.

| Endpoint | Access | Reads | Returns |
| --- | --- | --- | --- |
| `town-guide` | public | Static town/policy config, public businesses, public reports | Navigation answer + destinations + sources |
| `forum-summary` | public | One published public `forum_threads` row and its `forum_posts` replies, through the caller's session | Summary with facts/allegations/disagreements kept separate |
| `report-assistant` | authenticated | **Nothing.** Draft comes from the request body only | Chronology, gaps, sensitive-info flags |
| `moderation-review` | moderator / admin / owner | One moderation queue item, joined to the report or forum record it points at | A recommendation, never an action |
| `business-transparency` | public | One business profile + the reports linked to it by `business_id` | What the public record shows |

Success response shape:

```jsonc
{
  "data":  { /* validated against the feature's output schema */ },
  "requestId": "uuid",          // also returned as the x-request-id header
  "aiGenerated": true,
  "humanReviewRequired": false, // always true for moderation-review
  "disclaimer": "..."
}
```

Error response shape:

```jsonc
{ "error": { "code": "rate_limited", "message": "...", "details": { } }, "requestId": "uuid" }
```

Codes map to status via `STATUS_BY_CODE` in `errors.ts`: `ai_disabled` → 503, `unauthenticated` → 401,
`forbidden` → 403, `rate_limited` → 429, `invalid_request` → 400, `upstream_timeout` → 504,
`upstream_error` / `invalid_model_output` / `internal_error` → 502/500.

---

## 3. What stops the model reading private data

Four independent layers. Any one of them failing does not by itself expose a record.

1. **RLS.** Every tool queries through the caller's session-bound Supabase client
   (`resolveAiPrincipal()` → `getCurrentPrincipal()`). The database refuses rows the caller cannot
   see. The service-role key is never used in any AI path.
2. **Second-layer filters in the tool.** Public report tools additionally filter
   `is_anonymous = false`; forum tools filter `status = 'published'` and `visibility = 'public'`;
   the Education Library tool filters `status = 'APPROVED'` so drafts and rejected material can
   never be surfaced. This holds even if an RLS policy is later loosened.
3. **Explicit column selects.** No tool uses `select('*')`. Reporter identity columns and evidence
   file references are never in a select list, so they cannot reach the model even accidentally.
   `reports.description` — the reporter's raw, possibly unreviewed narrative — is deliberately
   neither selected nor searched by any public tool; the curated `public_summary` is used instead.
   Free-text search values are quoted before they enter a PostgREST `or(...)` filter so crafted
   input cannot append a condition on a column the select omits.
4. **Per-feature tool allow-lists.** `getToolsForFeature()` in `tools/index.ts` decides what exists.
   The town guide has no tool that can read a moderation queue; `report-assistant` has no tools at
   all and accepts no record id, so it is structurally incapable of reaching another user's report.

### Prompt injection

Anything originating from a user or the database is wrapped by `asUntrustedContent(label, content)`
and delivered as a separate input item. The wrapper strips `<untrusted-content>` delimiters from the
payload so retrieved text cannot forge a closing tag and escape the block. The system prompt states
that content inside such a block is data and never instruction. See `tests/ai-prompts.test.ts`.

Model-supplied tool arguments are re-validated against the tool's Zod schema server-side regardless
of what the model produced, and a rejected call returns an error payload to the model rather than
aborting the request.

---

## 4. Audit trail

Every AI request writes one row to `public.ai_audit_logs` — successes, refusals, rate limits and
errors alike. Audit failure never fails the user's request (`recordAiAudit()` warns and returns
`false`).

**The table stores metadata only.** Never a prompt, a draft, a model response, evidence, or an
upstream error body. Records the AI read are stored as `{ record_type, record_id }` references.

Why a new table rather than extending `audit_logs`: `audit_logs` records "an actor changed a
resource" and its read policy is intentionally admin-and-owner-only. An AI request is not a state
change, and residents must be able to see their own AI activity — granting that on `audit_logs`
would have meant widening a deliberately hardened policy. The two coexist: a moderation action taken
*because of* an AI recommendation still writes its own `audit_logs` row referencing
`ai_audit_logs.request_id`. Full rationale is in the migration header.

RLS on the new table: residents read their own rows; admins and the platform owner read all;
authenticated callers may insert only rows attributed to themselves; anonymous callers may insert
only rows with `user_id IS NULL`. There is no `UPDATE` or `DELETE` policy, so the trail is
append-only.

### Applying the migration

`prisma/migrations/20260728120000_ai_audit_logs/migration.sql` is **purely additive** — it creates
one table with its indexes and policies and alters nothing that already exists.

It has **not** been applied to production. Apply it through a Supabase development branch:

```bash
# 1. create a dev branch, 2. apply there, 3. verify, 4. only then merge to production
supabase branches create ai-audit --project-ref idtnlninotxwqpznbwur
supabase db push --db-url "<dev-branch-url>"
```

Verify on the branch before merging:

```sql
-- policies exist and the table is protected
select policyname, cmd, roles from pg_policies where tablename = 'ai_audit_logs';
select relrowsecurity from pg_class where relname = 'ai_audit_logs';

-- append-only: no UPDATE or DELETE policy should be returned above
```

Then run the Supabase advisors on the branch and confirm no new findings before merging.

---

## 5. Configuration

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | no | — | Server-only. Absent ⇒ every AI route 503s and the Town Guide hides itself. |
| `OPENAI_MODEL` | no | `gpt-4o-mini` | Used by all features. |
| `OPENAI_MODERATION_MODEL` | no | `omni-moderation-latest` | Classification model. |
| `OPENAI_AI_FEATURES_ENABLED` | no | `true` | Master kill switch. `false` disables AI even with a key. |
| `OPENAI_REQUEST_TIMEOUT_MS` | no | `30000` | Clamped to 5 000–120 000. |
| `OPENAI_MAX_INPUT_CHARACTERS` | no | `8000` | Clamped to 500–40 000. |
| `OPENAI_MAX_OUTPUT_TOKENS` | no | `1200` | Clamped to 256–8 000. |

Never prefix any of these with `NEXT_PUBLIC_`. Out-of-range tuning values are clamped rather than
rejected, so a typo degrades behaviour instead of breaking the deployment.

**Disabling AI in an incident:** set `OPENAI_AI_FEATURES_ENABLED=false` and redeploy. No code change,
no database change. `getAiConfig()` is read fresh per request, so instances pick it up without a
cold start once the new env is live.

---

## 6. Rate limiting

Two windows, both enforced in `enforceRateLimit()`:

- **Burst:** 8 requests/minute per caller per feature.
- **Daily:** per subscription tier — free 25, verified 75, professional 250, business 500,
  enterprise 2 000. Anonymous visitors get 10. The daily budget is shared across features.

Paid tiers buy *more usage*, never better outcomes, different moderation, or improved reputation.
That is a platform doctrine, not an implementation detail — see
`src/config/platform-policies.ts`.

> **Known limitation.** The default limiter is in-process. On Vercel each serverless instance has its
> own memory, so this bounds abuse per instance and is **not** a cluster-wide guarantee. It is the
> integration point, not the final answer: call `setRateLimiter()` with a Redis/Upstash or
> Postgres-backed implementation to get a global limit without touching any route.

Anonymous callers are keyed by proxy-provided IP. That IP is used for counting only — it is never
logged and never persisted.

---

## 7. Adding a feature

1. Add the name to `AI_FEATURES` in `config.ts` — this also extends the migration's `feature` CHECK
   constraint, so add a matching additive migration.
2. Add request and output schemas in `schemas.ts`. Optional output fields must be `.nullable()`, not
   `.optional()`: OpenAI strict mode requires every property to appear in `required`.
3. Add a system prompt in `prompts.ts` stating what the feature may and may not do.
4. Add an access rule in `FEATURE_RULES` in `permissions.ts`.
5. Allow-list its tools in `tools/index.ts`. Grant the narrowest set that works.
6. Create `src/app/api/ai/<feature>/route.ts` using `createAiRoute()`.
7. Add tests. At minimum: the access rule, and that the output schema cannot express a forbidden
   outcome.

---

## 8. Testing

```bash
npm test           # vitest run
npm run test:watch
```

Tests are in `tests/` and cover pure logic only — no network, no database, no API key. The
safety-critical assertions are:

- `ai-prompts.test.ts` — untrusted-content delimiters cannot be forged.
- `ai-schemas.test.ts` — `requiresHumanReview` is a literal `true` and cannot be set false; the
  business output has no field capable of carrying a score or grade; report-assistant has no field
  that could reference another user's report.
- `ai-permissions.test.ts` — the kill switch overrides every role including platform owner;
  `unauthenticated` is reported before `forbidden` so role requirements do not leak.
- `ai-rate-limit.test.ts` — spoofable headers are ignored for authenticated callers.
