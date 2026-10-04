# Entitlement rules: free threads and AI quotas

Status: **Draft v1 — Free tier only.** Paid tiers are reserved names in this
document; nothing commercial is implemented, billed, or hardcoded. See
`docs/commercial-schema-map.md` for how paid plans will plug in later without
touching the rules below.

Owner: Michael Carter. Last updated: 2026-10-03.

---

## 1. Why entitlements exist

The Green List publishes source-linked public records. The forum is the
evidence-intake and discussion layer around those records. Entitlements exist
to do three things, in this order:

1. **Keep the room honest.** A new-thread cap and reply rate limits make
   marketing spam, astroturfing, and drive-by claims expensive in effort, not
   money.
2. **Keep public truth free.** Reading records, articles, research, and
   public forum threads never requires an account, a card, or a plan.
3. **Meter what actually costs money.** The AI assistant spends gateway
   credits per request; it is the one feature with a real marginal cost and
   the one place a quota is justified on cost grounds.

Entitlements are **not** a trust signal. Plan, quota, and payment state never
appear on a public profile, a badge, a report, a verification status, or a
moderation decision. (See `concepts/non-transactional-platform-policy`.)

---

## 2. Vocabulary

| Term | Meaning |
| --- | --- |
| **Plan** | A named bundle of limits. Today exactly one plan exists: `free`. |
| **Limit** | A numeric ceiling for one action in one window (e.g. `threads.new` = 2 per calendar month). |
| **Usage** | Count of a limited action by one profile inside the current window. |
| **Entitlement check** | `can I do X right now?` Answered by the database, not the UI. |
| **Window** | Calendar month in UTC for monthly limits; rolling 24h / 1h for rate limits. |
| **New thread** | A row inserted into `public.forum_threads`. This is the "new question to a forum." |
| **Reply** | A row inserted into `public.forum_posts`. |
| **AI query** | One accepted `POST /api/ai` request. |

A **thread** and an **AI query** are different things. Asking a forum is
asking people. Asking the assistant is spending compute. They are metered
separately and never trade against each other.

---

## 3. Access matrix

Who may do what. Plan limits apply on top of this; this table is about
eligibility, not quantity.

| Capability | Anonymous visitor | Signed-in, unverified | Signed-in, age-attested (21+) | Operator roles (`BUSINESS`, `CULTIVATOR`, `DISTRIBUTOR`) | Reviewer roles (`MODERATOR`, `ADMIN`) |
| --- | --- | --- | --- | --- | --- |
| Read public records, articles, research, education | Yes | Yes | Yes | Yes | Yes |
| Read public forum threads and replies | Yes | Yes | Yes | Yes | Yes |
| Search | Yes (50-result cap, existing) | Yes | Yes | Yes | Yes |
| File a report / submit evidence | Existing rules unchanged | | | | |
| Create a new thread | No | No | **Yes, capped** | Yes, capped | Yes, uncapped |
| Reply to a thread | No | No | **Yes, rate-limited** | Yes, rate-limited | Yes, rate-limited |
| Use the AI assistant | No (existing) | No | **Yes, quota** | Yes, quota | Yes, quota |

Rules behind the matrix:

- **Age attestation is the gate for participation, not money.** Posting and
  AI use require `profiles.age_attested_at IS NOT NULL` (new column, see §7)
  and `profiles.account_status = 'active'`. No DOB is stored; only the fact
  and timestamp of attestation. Operator and reviewer roles are assumed
  attested by virtue of their vetting but the column is still set for them.
- **Operators are capped like everyone else** until a Professional seat
  exists. A dispensary account posting a dozen "threads" a month is the
  marketing pattern the cap exists to stop.
- **Reviewers are exempt from the new-thread cap** because they open
  procedural threads (notices, corrections, pinned explainers). They remain
  subject to reply rate limits so a compromised reviewer account is still
  bounded.
- **Suspended or restricted accounts** (`account_status <> 'active'`) fail
  every write check regardless of plan. Entitlements never override
  moderation.

---

## 4. Free plan limits

These are the normative numbers for launch. They live in a config table
(`public.entitlement_limits`), not in code, so they can be tuned from SQL
without a deploy. The values below are the seed.

| Key | Window | Free | Why this number |
| --- | --- | --- | --- |
| `threads.new` | calendar month (UTC) | **2** | Your "one or two new questions a month." Enough for a real person with a real question; not enough to run a campaign. |
| `replies.hour` | rolling 60 min | **20** | Lets a conversation happen; stops copy-paste floods. |
| `replies.day` | rolling 24 h | **100** | Daily backstop. |
| `replies.day.new_account` | rolling 24 h, accounts < 72 h old | **10** | Sock-puppet brake. Lifts automatically at 72 h. |
| `ai.queries.month` | calendar month (UTC) | **10** | Enough to try the assistant and get real value; small enough that the free pool's gateway cost is predictable. |
| `ai.queries.day` | rolling 24 h | **3** | Prevents one account from burning its month in an hour (and from testing abuse at scale). |
| `ai.prompt.max_chars` | per request | **4,000** | Existing constant in `/api/ai`; moved to config. |
| `ai.output.max_tokens` | per request | **500** | Existing constant in `/api/ai`; moved to config. |

Reserved plan codes (no limits defined, no rows seeded, nothing enforced):
`member`, `supporter`, `professional`. Their names are reserved only so the
free tier's resolver has a stable shape to grow into. **Do not seed them until
the free tier has been observed in production** (see §10).

---

## 5. Counting rules

Ambiguity here is where people feel cheated, so these are explicit.

### 5.1 New threads (`threads.new`)

- A thread **counts when the row is inserted**, i.e. when the user presses
  Post. Drafts (if drafts are introduced later) never count.
- A thread **still counts** if the author later deletes it, if a moderator
  removes it, or if it is locked. Otherwise the cap is trivially bypassed by
  post-delete-repost.
- A thread **does not count** if an admin marks it as an erroneous
  submission (duplicate from a double-submit, platform bug) by inserting a
  credit row in `public.entitlement_adjustments`. This is a human action with
  an audit trail, never automatic.
- The cap is per **profile**, not per forum. "Two per forum" would let one
  account open 2 × N threads across N forums; that is not what the cap is
  for.
- Window is the **calendar month in UTC**. Reset is predictable ("resets on
  the 1st"), easy to explain in the UI, and easy to audit. Rolling windows
  are harder to game but much harder for a person to reason about.
- Unused slots **do not roll over**.

### 5.2 Replies (`replies.*`)

- Replies are **unlimited per month**. A free member can take part in any
  conversation indefinitely.
- Rate limits are rolling, counted from `forum_posts.created_at`, and apply
  to every role including reviewers.
- The new-account limit uses `profiles.created_at`, not the auth user's
  creation time, so a profile recreated after deletion starts the clock again.

### 5.3 AI queries (`ai.*`)

- A query **counts when the request is accepted**: after auth, age, and
  account-status checks pass and before the provider is called. This is the
  only order that prevents a client from aborting the stream to avoid being
  counted.
- A query is **refunded** (the usage row is marked `refunded = true`) when
  the provider returns 5xx, 402, 403, or 503 before any token is streamed.
  Client-side aborts after streaming has begun are **not** refunded.
- `GET /api/ai` (capability/metadata probe) is never counted.
- Every accepted query writes to `public.ai_usage_events` (new, see §7).
  `public.ai_audit_logs` (existing) remains the content/safety audit trail;
  usage and audit are kept separate so retention policies can differ.

### 5.4 What never counts

Reading. Searching. Filing a report. Submitting evidence. Editing your own
profile. Voting or reacting, if introduced. Flagging content for moderation.
None of these are limited by plan, ever.

---

## 6. Enforcement model

**The database is the authority.** Route handlers call it; they do not
re-implement it. Direct inserts (service role, SQL console, a future mobile
client) hit the same wall.

```
                 ┌──────────────────┐
  POST /api/posts│ check_entitlement│──► 429 + headers if denied
  POST /api/ai   │ (RPC, SECURITY   │
                 │  DEFINER)        │
                 └────────┬─────────┘
                          │ allowed
                          ▼
             insert forum_threads  /  insert ai_usage_events
                          │
            BEFORE INSERT trigger re-checks the same function
            (defense in depth; raises if the route was bypassed)
```

### 6.1 SQL surface

| Object | Kind | Purpose |
| --- | --- | --- |
| `public.entitlement_limits` | table | Config: `(plan_code, limit_key, window, max_value)`. Seeded with `free` rows only. Admin-writable, authenticated-readable. |
| `public.entitlement_adjustments` | table | Human-issued credits/debits with reason and actor. Append-only. |
| `public.ai_usage_events` | table | One row per accepted AI query: `profile_id, created_at, model, prompt_chars, refunded, request_id`. |
| `public.current_plan(p_profile uuid)` | function | Returns `'free'` for every profile today. **This is the single seam** the commercial side will later replace (see commercial map §4). |
| `public.entitlement_usage(p_profile uuid, p_key text)` | function | Returns `(used, max_value, window_start, window_end)` for a key. |
| `public.check_entitlement(p_profile uuid, p_key text)` | function | Returns `(allowed bool, used int, max_value int, resets_at timestamptz, reason text)`. Applies role exemptions and `account_status`. |
| `public.consume_ai_query(...)` | function | Atomically checks `ai.queries.*` and inserts the usage row. Returns the same shape as `check_entitlement`. |
| `forum_threads_enforce_entitlement` | trigger | `BEFORE INSERT` on `forum_threads`; raises `P0001` with a stable message if `check_entitlement(author_id, 'threads.new')` is false. |
| `forum_posts_enforce_rate_limit` | trigger | `BEFORE INSERT` on `forum_posts`; same pattern for `replies.*`. |
| `public.my_entitlements()` | function | Convenience RPC for the signed-in user: all keys with used/max/resets_at. Powers the UI counter. |

All functions are `SECURITY DEFINER`, `set search_path = ''`, and read
`profiles.role` through the existing `public.platform_role()` so there is one
role source of truth.

### 6.2 HTTP contract

When a check fails the route returns **429 Too Many Requests** (not 402, not
403; nothing is for sale and nothing is forbidden) with:

```
Retry-After: <seconds until resets_at>
X-Entitlement-Key: threads.new
X-Entitlement-Used: 2
X-Entitlement-Limit: 2
X-Entitlement-Resets-At: 2026-11-01T00:00:00Z
```

and a JSON body `{ error, key, used, limit, resetsAt }`.

Age or account-status failures return **403** with `{ error: "age_attestation_required" }`
or `{ error: "account_restricted" }` so the UI can route to the right fix.

Every successful thread or AI response also carries the `X-Entitlement-*`
headers for the key just consumed, so the client can update its counter
without a second request.

### 6.3 What the UI shows

- Forum composer: "New threads this month: 1 of 2 remaining. Resets Nov 1."
  Replies show nothing unless a rate limit is hit.
- At the cap: composer is replaced by a short notice, with a link to the
  thread list for the forum ("You can still reply to any thread").
  No upsell. No "upgrade" button exists yet, and when a Member plan does
  exist the notice will state the limit first and the option second.
- AI assistant: "10 questions a month on the free plan · 7 left." When
  exhausted: "You've used this month's assistant questions. Resets Nov 1."
- Age gate: a one-time, one-checkbox attestation on first write attempt.
  Copy must state plainly that nothing is sold here and that the attestation
  is required because the subject matter is age-restricted, not because
  anything is for sale.

---

## 7. Schema changes (free tier only)

Additions to `public`. No `commercial` schema is created by this spec.

```sql
-- profiles: participation gate (no DOB stored)
alter table public.profiles
  add column if not exists age_attested_at timestamptz;

-- plan limits (config, not code)
create table public.entitlement_limits (
  plan_code   text not null,
  limit_key   text not null,
  window_kind text not null check (window_kind in ('calendar_month','rolling_24h','rolling_1h','per_request')),
  max_value   integer not null check (max_value >= 0),
  notes       text,
  updated_at  timestamptz not null default now(),
  primary key (plan_code, limit_key)
);

-- human-issued corrections to usage
create table public.entitlement_adjustments (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  limit_key   text not null,
  delta       integer not null,          -- negative = credit back
  reason      text not null,
  actor_id    uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- metered AI usage
create table public.ai_usage_events (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  model        text not null,
  prompt_chars integer not null,
  refunded     boolean not null default false,
  request_id   text
);
create index on public.ai_usage_events (profile_id, created_at desc);
```

Seed for `entitlement_limits` is exactly the §4 table with `plan_code = 'free'`.

RLS: `entitlement_limits` readable by `authenticated`, writable by
`is_admin()`. `entitlement_adjustments` readable by self or `is_reviewer()`,
insertable by `is_admin()`. `ai_usage_events` readable by self or
`is_admin()`; inserted only through `consume_ai_query` (no direct insert
grant).

Privileges follow the existing lock-down migration: no `TRUNCATE`, `TRIGGER`,
or `REFERENCES` for `anon`/`authenticated`.

---

## 8. Observability

- `public.entitlement_usage_monthly` (view, admin-only): per plan, per key,
  per month: distinct users who hit the cap, total usage, p50/p95 usage.
  This is the data that decides whether 2 and 10 are the right numbers.
- `/api/ai` logs `request_id`, `profile_id`, `model`, and
  `entitlement.used/limit` on every accepted call so Vercel logs can be
  joined to `ai_usage_events`.
- Dashboard quick stat (authenticated): threads remaining this month, AI
  questions remaining. Reuses the existing resilient empty-state pattern.

---

## 9. Acceptance criteria

Free tier is done when all of these pass against a branch database:

1. Anonymous user can read every public route and gets 401 on `POST /api/posts`, `POST /api/forum-posts`, `POST /api/ai`.
2. Signed-in user without `age_attested_at` gets 403 `age_attestation_required` on all three; after attestation the same requests succeed.
3. Third `POST /api/posts` in a calendar month returns 429 with correct `X-Entitlement-*` headers and `Retry-After`; a direct `insert into forum_threads` as that user via SQL raises.
4. Deleting one of the two threads does not free a slot. An admin credit row in `entitlement_adjustments` does.
5. 21st reply inside 60 minutes returns 429; 20 minutes later it succeeds.
6. A profile under 72 h old is limited to 10 replies/day; the same profile at 73 h is limited to 100.
7. 11th `POST /api/ai` in a month returns 429 before the provider is called (verify no gateway spend).
8. 4th `POST /api/ai` in 24 h returns 429 even with monthly quota remaining.
9. A provider 503 on the first token marks the usage row `refunded = true` and the user's remaining count is unchanged.
10. `MODERATOR` can open a 3rd thread; `BUSINESS` cannot.
11. `my_entitlements()` returns the same numbers the headers reported.
12. No public profile, badge, report, or search result exposes plan or usage.
13. Reduced-motion, keyboard, and 320px checks pass on the composer notice and age gate (Issue #12 scope).

---

## 10. Observation period before any paid tier

The free tier runs alone for at least one full calendar month after launch.
During that month, collect:

- What percentage of age-attested users hit `threads.new`. If it is under
  ~5%, the cap is invisible and may be fine as-is or could be 3. If it is
  over ~20%, real people are being blocked and the number should rise before
  anything is monetized.
- Median and p95 AI queries per active user, and total gateway spend for
  the free pool. This sets the Member allowance and tells you whether $4.99
  covers it.
- How many thread creations are moderated for marketing within 30 days.
  This is the number the cap exists to protect; if it is high, the problem
  is verification, not price.

Only after these numbers exist does the commercial map move from document to
migration.

---

## 11. Known gaps and decisions needed

- **No age field exists today.** `age_attested_at` is new. Decide whether
  attestation happens at sign-up (friction for readers who never post) or at
  first write (recommended here).
- **`profiles.verification_status`** currently carries business-claim
  semantics. This spec does not reuse it for consumers; it uses
  `age_attested_at` so the two meanings do not blur.
- **`/api/membership/validate`** (GoHighLevel tag lookup, `Active_Member`
  / `Premium_Tier`) is a pre-existing membership path that bypasses the
  database. It should be retired or routed through `current_plan()` before
  any paid plan launches, or there will be two sources of truth.
- **Target database.** The live site (thegreenlist.online) uses Supabase
  project `idtnlninotxwqpznbwur`; that is where this migration belongs, on a
  branch first. The project named "Blacklist" (`hdqxilnjhcqalrgaykst`) is a
  separate project and must not receive it. See
  `docs/blacklist-supabase-audit.md` for what that project contains.
- **Anonymous threads** (`forum_threads.is_anonymous`) still count against
  the author's cap; anonymity is presentational, not a separate identity.

---

## Sources

- Reddit Premium pricing, used as the consumer comparable: https://support.reddithelp.com/hc/en-us/articles/360043034412-What-is-a-Reddit-Premium-subscription
- Freemium community conversion benchmarks (1–4%): https://startupfinancialprojection.com/blogs/kpis/online-community
- Stripe prohibited and restricted businesses: https://stripe.com/legal/restricted-businesses
- Stripe card pricing (2.9% + 30¢), relevant to minimum viable price points: https://stripe.com/pricing
- Existing role functions and policies: `supabase/migrations/20260913071000_unify_role_system.sql`
- Existing privilege lock-down: `supabase/migrations/20260913120000_lock_down_table_privileges.sql`
- Existing AI route: `src/app/api/ai/route.ts`
