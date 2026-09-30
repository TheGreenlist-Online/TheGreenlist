# Implementation Plan — AI Services & Green List Town

Companion to [`docs/ASSESSMENT.md`](docs/ASSESSMENT.md) (what the repository looked like before this
work) and [`docs/ai-services.md`](docs/ai-services.md) (how the AI layer works once merged).

This document records what was built, what was deliberately deferred, and what a maintainer must do
before and after merging.

---

## Scope decision

The directive covered five AI features, a town interface, an audit trail, a view switcher,
documentation and tests. Rather than half-build all five endpoints, this change delivers **one
complete vertical slice** — AI foundation, Town Guide end to end, audit trail, view switcher — and
builds the remaining four endpoints on that same foundation without claiming they are verified
against production data.

Concretely: the Town Guide is the only feature exercised end to end from UI through to audit row.
The other four routes are implemented, typechecked and access-controlled, and their database reads
have since been corrected against the live column-level schema (see *Schema verification* below),
but they have no UI yet and no request has been executed against production data.

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

`town-guide`, `forum-summary`, `report-assistant`, `moderation-review`, `business-transparency`.
Each exposes `GET` (availability probe) and `POST`.

### 3. Configuration as data — `src/config/`

- `town-locations.ts` — the single source of truth for town geography. Replaced three separate
  hard-coded district arrays.
- `platform-policies.ts` — six public policies the guide can cite verbatim rather than paraphrase.

### 4. Town interface

- `src/app/town/page.tsx` now renders from `TOWN_LOCATIONS` and mounts the guide.
- `src/app/town/[locationId]/page.tsx` — new; statically generated from the config, so every
  `townHref` resolves instead of 404ing.
- `src/components/town/TownGuidePanel.tsx` — the guide UI.
- `src/components/town/TownLocationIcon.tsx` — shared icon mapping.

### 5. View switcher

- `src/lib/view-switch.ts` — resolves the counterpart path, preserving query string, hash and any
  open record id.
- `src/components/ViewSwitchLink.tsx` — replaces the previous `pathname.startsWith('/town') ? '/' :
  '/town'` logic that was duplicated in the desktop and mobile navs and dropped all context.

### 6. Audit migration

`prisma/migrations/20260728120000_ai_audit_logs/migration.sql` — one new table, purely additive.

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
column is missing, rather than 500ing. The Town Guide is grounded primarily in static config, so it
works correctly even where database reads degrade. This is kept even now that the reads are verified,
because the repo's migrations still are not the source of truth.

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

**`themeSlug` on each town location.** The ribbon drives `district--*` custom properties in
`globals.css`. Several locations intentionally share a theme, so the slug is data on the location
rather than something derived from its id — this kept the stylesheet untouched while removing the
duplicate config.

---

## Required before merge

1. **Apply the migration through a Supabase development branch**, verify, then merge to production.
   It has not been applied. Commands and verification queries are in `docs/ai-services.md` §4.
   Until it is applied, AI endpoints still work — audit writes fail soft and log a warning.
2. **Set `OPENAI_API_KEY`** in the Vercel project. Until then every AI route returns 503 and the
   Town Guide renders nothing. This is the intended unconfigured state, not a failure.
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

- **The migration is unapplied.** No Supabase credentials or MCP tooling were reachable from the
  build environment, so the branch-create → apply → verify → merge workflow could not be executed.
  The migration was written to be purely additive so that a maintainer can run it safely.
- **Four of five routes have no UI and have never been run against real data.** Their schemas are
  verified and their selects are correct, but only the Town Guide is exercised end to end.
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

**Enable the remaining four endpoints.** In order: apply the migration on a dev branch, run each
route once against real data to confirm the corrected selects behave as expected, then build the
moderator-facing UI for `moderation-review` — the feature with the most operational value and the
strictest human-in-the-loop requirement. That UI is also where the real set of `content_type`
values will become apparent, which is the one schema question still genuinely open.
