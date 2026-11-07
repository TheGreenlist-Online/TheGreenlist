# Implementation Plan — AI Services & Records Guide

Companion to [`docs/ASSESSMENT.md`](docs/ASSESSMENT.md) (what the repository looked like before this
work) and [`docs/ai-services.md`](docs/ai-services.md) (how the AI layer works once merged).

This document records what was built, what was deliberately deferred, and what a maintainer must do
before and after merging.

---

## Scope decision

The change delivers the shared AI foundation, a public-record guide integrated into the current
records-based homepage, an audit trail, documentation, and tests. The retired Town pages, panel, and
interface switcher are not part of the current product and are not restored here.

The Records Guide is the only feature with a user-facing UI. The other four routes are implemented,
typechecked and access-controlled, but have no UI and have not been exercised against hosted data.

---

## What was built

### 1. AI foundation — `src/lib/ai/`

A single orchestration path that every feature shares, so that timeouts, tool allow-lists, token
caps, output validation, rate limits and audit writes are enforced uniformly rather than per route.

| File | Purpose |
| --- | --- |
| `config.ts` | Env parsing, feature flags, kill switch. Never throws. |
| `client.ts` | The only `OPENAI_API_KEY` read in the codebase. Browser guard. |
| `errors.ts` | `AiError`, code→status map, log redaction. |
| `permissions.ts` | Access rules and per-tier daily allowances. |
| `rate-limit.ts` | Burst + daily counters, swappable backend. |
| `prompts.ts` | System prompts, untrusted-content framing. |
| `schemas.ts` | Zod request/output schemas, JSON Schema conversion. |
| `tools/` | Narrow, allow-listed, Zod-validated database access. |
| `run.ts` | Responses API call, bounded tool loop, strict output validation. |
| `route-handler.ts` | The shared pipeline. |
| `audit.ts` | Metadata-only audit writes. |

### 2. API routes — `src/app/api/ai/`

`records-guide`, `forum-summary`, `report-assistant`, `moderation-review`, `business-transparency`.
Each exposes `GET` (availability probe) and `POST`.

### 3. Configuration as data — `src/config/`

- `navigation.ts` — the guide's canonical source for records-section destinations.
- `platform-policies.ts` — public policies the guide can cite rather than speculate about.

### 4. Records Guide interface

- `src/components/ai/RecordsGuide.tsx` — a public-record assistant using the shared site shell.
- `src/app/page.tsx` — mounts the guide on the records-based homepage.
- `/town` remains retired; its redirect is not a second interface.

### 5. Audit migration

`20261019050000_ai_audit_logs.sql` defines the table; `20261107010000_ai_audit_permissions.sql`
updates the feature constraint, canonical read authorization, and service-role append-only grants.
No migration is applied by this task; prior environment state is not re-queried here.

---

## Design decisions worth reviewing

**A dedicated `ai_audit_logs` table rather than extending `audit_logs`.** `audit_logs` records state
changes and is intentionally admin-read-only. Residents must be able to see their own AI activity;
granting that on `audit_logs` would have meant widening a policy that a July 2026 migration
deliberately hardened. Full rationale is in the migration header.

**Four independent layers stop the model reading private data**, rather than relying on RLS alone:
session-bound client (RLS), second-layer filters in each tool, explicit column selects, and
per-feature tool allow-lists. Detailed in `docs/ai-services.md` §3.

**`report-assistant` accepts no record id and has no tools.** It cannot reach another user's report
because there is no code path by which it could, not because a check forbids it.

**Graceful degradation over hard failure.** Repo migrations have drifted from the live database (see
`docs/ASSESSMENT.md`). Tools return `unavailable()` — "no results, plus a note" — when a table or
column is missing, rather than 500ing. The Records Guide is grounded in static navigation and policy
configuration, so it remains useful where public database reads degrade.

---

## Schema verification

The live column-level schema was read from the production project and every AI data read was
corrected against it. The four previously-unverified spots resolved as follows.

| Was | Actually |
| --- | --- |
| `business_profiles.business_name` / `license_number` / `license_state` | `name`, `state`, `city`. **No licence column exists** — the prompt now forbids stating or implying licensing at all. |
| `reports.category` / `business_name` / `location` | `report_type`; link by `business_id` FK; `location_state` / `location_city`. |
| thread content in `forum_posts.content`, replies in `forum_comments` | thread in `forum_threads` (`body`, `status = 'published'`, `visibility = 'public'`); replies in `forum_posts` (`thread_id`, `body`). **`forum_comments` does not exist**, and no table uses `status = 'approved'`. |
| `moderation_queue_items.content_excerpt` / `status` | `queue_status`; the item carries no text of its own. Reviewable text is joined from `reports` via `report_id`, or read from `forum_threads`/`forum_posts` via `content_id` when the reported record is a forum one. |

Two consequences worth calling out, both fixed here:

- `moderation-review` could **never** have worked. `content_excerpt` does not exist, so the excerpt
  was always undefined and the route always threw "no reviewable text available".
- `searchEducationResources` filtered on nothing, so `DRAFT`, `PENDING_REVIEW` and `REJECTED`
  resources could reach the model and therefore a reader. It now filters `status = 'APPROVED'`.

**`reports.description` is treated as sensitive throughout.** It holds the reporter's raw narrative
and may not have been reviewed. No public tool selects or searches it; the curated `public_summary`
is used instead, and `moderation-review` only falls back to a truncated `description` when a queue
item has no summary at all.

**Optional output fields are `.nullable()`, not `.optional()`.** OpenAI strict mode requires every
property to appear in `required`. This is easy to get wrong when adding a feature; it is called out
in `docs/ai-services.md` §7 and asserted in `tests/ai-schemas.test.ts`.

**Records destinations come from shared navigation.** The guide cannot invent a page path, and the
output schema independently rejects external or malformed destinations.

---

## Required before merge

1. **Complete staging permission setup and hosted tests.** Staging has the tables, but application
   permissions and hosted validation are incomplete. The proposed follow-up migration is not applied.
   Do not apply migrations to production as part of this task.
2. **Set `OPENAI_API_KEY`** in the Vercel project. Until then every AI route returns 503 and the
   Records Guide renders nothing. This is the intended unconfigured state, not a failure.
3. **Exercise the four UI-less routes once against real data.** Their column selects are now
   verified, but no request has been run end to end. `moderation-review` in particular should be
   called against one real queue item of each `content_type` before a moderator relies on it.

## Recommended after merge

1. **Replace the in-process rate limiter.** The default is per-instance and gives no cluster-wide
   guarantee on Vercel. `setRateLimiter()` exists for exactly this.
2. **Add an admin view over `ai_audit_logs`** — cost, latency and refusal rate per feature. The
   indexes for it are already in the migration.
3. **Enable Leaked Password Protection** in Supabase Auth — the one outstanding WARN advisor,
   unrelated to this change.

---

## Known limitations

- **Hosted permissions and tests are incomplete.** Staging has tables, but this task does not apply
  migrations or verify effective live grants. The SQL privilege regression is ready for staging.
- **Four of five routes have no UI and have not been run against hosted data.** Their schemas and
  query filters are covered by repository tests, but no real model/database request is exercised here.
- **`moderation_queue_items.content_type` values are not enumerated anywhere in the codebase.**
  There is no human moderation UI to mirror (`src/app/admin/moderation/page.tsx` is a stub), so the
  route resolves `forum_thread` and `forum_post` explicitly and falls back to the joined report for
  any other value. If production uses further values with their own tables, add them there.
- **Rate limiting is per-instance**, not global.
- **Cost estimates return `null` for unrecognised models** rather than guessing a number.
- **No end-to-end test of a real model call.** Tests cover pure logic only — no network, no
  database, no API key required.
- **Prisma/NextAuth remnants were left in place.** Removing them is a separate change with its own
  blast radius; the live usages are enumerated in `docs/ASSESSMENT.md`.

---

## Next milestone

**Enable the remaining four endpoints.** In order: finish staging permissions and hosted tests, run
each route against eligible data to confirm the selects behave as expected, then build the
moderator-facing UI for `moderation-review` — the feature with the most operational value and the
strictest human-in-the-loop requirement. That UI is also where the real set of `content_type`
values will become apparent, which is the one schema question still genuinely open.
