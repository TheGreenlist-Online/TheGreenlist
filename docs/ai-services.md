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

Routes never import the OpenAI SDK. `src/lib/ai/client.ts` creates the AI foundation client.
Both it and the credential-bearing audit writer import `server-only`, so Next.js rejects client
imports at build time. Configuration checks key presence without returning the key.

| Module | Responsibility |
| --- | --- |
| `config.ts` | Env parsing and feature flags. Never throws — build runs without secrets. |
| `client.ts` | Server-only OpenAI client factory; build-time boundary plus runtime guard. |
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
| `records-guide` | public | Public navigation and policy config, active businesses, published/corrected reports, eligible discussions | Records answer + internal destinations + sources |
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

1. **RLS.** Every data tool queries through the caller's session-bound Supabase client
   (`resolveAiPrincipal()` → `getCurrentPrincipal()`). The database refuses rows the caller cannot
   see. The service-role credential is used only by the separate metadata-only audit writer.
2. **Second-layer filters in the tool.** Business tools filter `is_active = true`; report tools filter
   for public statuses (`published` or `corrected`) and `is_anonymous = false`; discussion tools
   require a published public thread in an active forum and exclude anonymous threads. The Education
   Library tool filters `status = 'APPROVED'` so drafts and rejected material can never be surfaced.
   This holds even if an RLS policy is later loosened.
3. **Explicit column selects.** No tool uses `select('*')`. Reporter identity columns and evidence
   file references are never in a select list, so they cannot reach the model even accidentally.
   `reports.description` — the reporter's raw, possibly unreviewed narrative — is deliberately
   neither selected nor searched by any public tool; the curated `public_summary` is used instead.
   Free-text search values are quoted before they enter a PostgREST `or(...)` filter so crafted
   input cannot append a condition on a column the select omits.
4. **Per-feature tool allow-lists.** `getToolsForFeature()` in `tools/index.ts` decides what exists.
   The records guide has no tool that can read a moderation queue; `report-assistant` has no tools at
   all and accepts no record id, so it is structurally incapable of reaching another user's report.

### Prompt injection

Anything originating from a user or the database is wrapped by `asUntrustedContent(label, content)`
and delivered as a separate input item. The wrapper strips delimiter-like tags from content and
escapes markup, quotes, and control characters in labels before placing them in the source attribute.
This also applies to model-controlled tool names, including unknown tools. The system prompt states
that content inside such a block is data and never instruction. See `tests/ai-prompts.test.ts` and
`tests/ai-run.test.ts`.

Model-supplied tool arguments are re-validated against the tool's Zod schema server-side regardless
of what the model produced, and a rejected call returns an error payload to the model rather than
aborting the request.

---

## 4. Audit trail

Every AI request attempts to write one row to `public.ai_audit_logs` — successes, refusals, rate limits and
errors alike. Audit failure never fails the user's request (`recordAiAudit()` warns and returns
`false`). SDK construction, returned database errors, and rejected transport promises are all
contained. Audit warnings include only the feature, request ID, and a fixed diagnostic, never
upstream error text.

**The table stores metadata only.** Never a prompt, a draft, a model response, evidence, or an
upstream error body. Records the AI read are stored as `{ record_type, record_id }` references.

Why a new table rather than extending `audit_logs`: `audit_logs` records "an actor changed a
resource" and its read policy is intentionally admin-and-owner-only. An AI request is not a state
change, and residents must be able to see their own AI activity — granting that on `audit_logs`
would have meant widening a deliberately hardened policy. The two coexist: a moderation action taken
*because of* an AI recommendation still writes its own `audit_logs` row referencing
`ai_audit_logs.request_id`. Full rationale is in the migration header.

RLS on the table: residents read their own rows; callers with the canonical `audit.read` permission
read all rows. Only trusted server code using the service-role credential may insert audit rows;
browser credentials for `anon` and `authenticated` have no `INSERT` privilege or policy. The pending
permissions migration explicitly grants only `INSERT` to `service_role` and revokes `UPDATE`, `DELETE`,
and `TRUNCATE`; the corresponding SQL regression checks effective table privileges rather than relying
only on the absence of RLS policies.

### Applying the migration

`supabase/migrations/20261019050000_ai_audit_logs.sql` creates the audit table, indexes, and base
policies. `supabase/migrations/20261107010000_ai_audit_permissions.sql` is a follow-up for staging
instances where the table already exists: it adds the records-guide feature value, uses the canonical
audit permission helper, and removes service-role row mutation privileges. The retired `town-guide`
value remains accepted only so existing audit rows continue to satisfy the constraint.
`20261107020000_ai_audit_moderation_columns.sql` adds the two optional, bounded moderation
metadata columns when a separately bootstrapped audit table lacks them. It changes no grants or
policies and preserves historical rows with null values.

**Existing staging is not a clean migration target.** Its closed foundation has no application
policies, canonical `has_permission(text)` helper, or fixture data. Its audit table lacks
`moderation_recommendation` and `moderation_confidence`. Apply the additive column repair first
when those columns are absent: the older base migration comments on them and fails otherwise.
The permissions migration must still fail until the separately reviewed canonical permission
foundation exists. Do not invent a permissive helper or use production records to make tests pass.

Reconcile migration history and get approval for the exact staging access changes before applying
anything. Do not use a blanket chronological `db push` or promote a development database to production.

Staging contains tables, but application permissions and hosted tests are not complete.
Do not treat table presence as proof of effective permissions. The follow-up migration has not been
applied to staging or production. This task does not apply migrations or change live grants; production
state is not re-queried here.

No migration commands were run for this change. Before any future staging application,
confirm the existing staging project, migration history, effective grants, and approval
for the target. Do not infer readiness from the tables' presence.

Verify on the branch before merging:

```sql
-- policies exist and the table is protected
select policyname, cmd, roles, qual from pg_policies where tablename = 'ai_audit_logs';
select relrowsecurity from pg_class where relname = 'ai_audit_logs';

-- Verify effective service-role privileges after the follow-up migration.
select
  has_table_privilege('service_role', 'public.ai_audit_logs', 'INSERT') as can_insert,
  has_table_privilege('service_role', 'public.ai_audit_logs', 'UPDATE') as can_update,
  has_table_privilege('service_role', 'public.ai_audit_logs', 'DELETE') as can_delete,
  has_table_privilege('service_role', 'public.ai_audit_logs', 'TRUNCATE') as can_truncate;
```

Then run the Supabase advisors on the branch and confirm no new findings before merging.

---

## 5. Configuration

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | no | — | Server-only. Absent ⇒ AI POST requests return 503; status GETs report disabled and the Records Guide hides itself. |
| `OPENAI_MODEL` | no | `gpt-4o-mini` | Used by all features. |
| `OPENAI_MODERATION_MODEL` | no | `omni-moderation-latest` | Classification model. |
| `OPENAI_AI_FEATURES_ENABLED` | no | `false` | Explicit rollout gate. AI stays off with an existing key unless opted in. |
| `OPENAI_REQUEST_TIMEOUT_MS` | no | `30000` | Clamped to 5 000–120 000. |
| `OPENAI_MAX_INPUT_CHARACTERS` | no | `8000` | Clamped to 500–40 000. |
| `OPENAI_MAX_OUTPUT_TOKENS` | no | `1200` | Clamped to 256–8 000. |

Never prefix any of these with `NEXT_PUBLIC_`. Out-of-range tuning values are clamped rather than
rejected, so a typo degrades behaviour instead of breaking the deployment.

**Activation:** keep the flag unset or `false` through code deployment. Enable it only in the
approved isolated staging environment after its schema, auth, grants and RLS have been verified.
Check the existing deployment value: an explicit `true` remains an opt-in and is not reset by this code.
Use approved synthetic/de-identified fixtures for the four UI-less routes and each supported
moderation content type. Verify unauthorized requests, audit writes, and the Records Guide safety
notice before a separate production activation decision. Credential setup requires its own approval.
The retired `/town` interface and view switcher are not acceptance targets.

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
npm test           # Vitest + Node tests, including isolated PostgreSQL migration tests
npm run test:watch
```

Tests are in `tests/` and use no live network, database, or API key. Audit migration tests execute
the real SQL in disposable PGlite PostgreSQL with fixture auth helpers; they do not prove that
hosted staging has the required foundation. The
safety-critical assertions are:

- `ai-audit.test.ts` — construction, query, transport and returned errors remain fail-soft; no upstream details reach logs.
- `ai-audit-migrations.test.mjs` — fresh and existing tables, metadata constraints, effective role writes, RLS row visibility, and explicit missing-helper failure.
- `records-guide.test.ts` — safety notice visibility, absence, and escaped text rendering.
- `server-secret-boundaries.test.mjs` — client imports fail before either AI credential module loads SDKs.
- `ai-prompts.test.ts` — untrusted-content delimiters cannot be forged.
- `ai-schemas.test.ts` — `requiresHumanReview` is a literal `true` and cannot be set false; the
  business output has no field capable of carrying a score or grade; report-assistant has no field
  that could reference another user's report.
- `ai-permissions.test.ts` — the kill switch overrides every role including platform owner;
  `unauthenticated` is reported before `forbidden` so role requirements do not leak.
- `ai-rate-limit.test.ts` — spoofable headers are ignored for authenticated callers.
