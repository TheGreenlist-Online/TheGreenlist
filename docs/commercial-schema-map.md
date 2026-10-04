# Commercial schema map (Supabase)

Status: **Map only. Nothing in this document is implemented, migrated, or
seeded.** It exists so the free-tier entitlement work in
`docs/entitlements-spec.md` is built with the right seam, and so the paid side
can be added later without touching verification, moderation, or records.

Hard rule carried from the platform policy: **no one can buy a better truth
status.** Money buys compute, convenience, and tooling. It never buys
verification, badge state, report outcomes, moderation outcomes, removal,
ranking, or placement.

---

## 1. Where the boundary sits

```
┌──────────────────────────────────────────────────────────────────────┐
│ public schema (exists today)                                         │
│                                                                      │
│  profiles ── role, account_status, age_attested_at                   │
│  forum_threads / forum_posts          reports / verified_facts       │
│  business_profiles                    moderation_* / audit_logs      │
│  entitlement_limits   ◄── config, seeded 'free' only                 │
│  entitlement_adjustments                                             │
│  ai_usage_events                                                     │
│                                                                      │
│  current_plan(profile) ──────────────────────┐  the ONLY seam        │
└──────────────────────────────────────────────┼───────────────────────┘
                                               │ reads plan_code
┌──────────────────────────────────────────────▼───────────────────────┐
│ commercial schema (future, not created)                              │
│                                                                      │
│  plans → prices → subscriptions → entitlement_grants                 │
│  customers (processor ids)        org_seats (Professional)           │
│  processor_events (webhook mirror)                                   │
│  funding_disclosures (public page source)                            │
└──────────────────────────────────────────────────────────────────────┘
```

Three structural guarantees, enforceable in SQL review:

1. **No foreign key from any `public` verification, moderation, report, or
   record table into `commercial`.** Ever. Lint rule: a migration that adds
   such a key is rejected.
2. **`commercial` has exactly one outbound effect on `public`:** the value
   `current_plan(profile)` returns. Every other read is reporting.
3. **`commercial` is written only by the billing webhook handler (service
   role) and by admins through audited functions.** `anon` and
   `authenticated` have no grants on the schema beyond reading their own
   subscription summary through a view.

---

## 2. Table map

Column lists are intentionally compact. Types follow existing conventions
(`uuid` PKs, `timestamptz`, lowercase check-constrained status strings).

| Table | Purpose | Key columns | Written by |
| --- | --- | --- | --- |
| `commercial.plans` | Catalog of plan codes. Mirrors the reserved names in the free-tier spec. | `code` PK (`free`, `member`, `supporter`, `professional`), `display_name`, `audience` (`individual` / `organization`), `is_active`, `public_description` | admin |
| `commercial.prices` | Price points per plan per interval. One plan may have several (monthly, annual). | `id`, `plan_code` FK, `interval` (`month` / `year`), `amount_cents`, `currency`, `processor_price_id`, `is_active` | admin |
| `commercial.customers` | Maps a profile or organization to a processor customer id. | `id`, `profile_id` FK → `public.profiles` (nullable), `business_profile_id` FK → `public.business_profiles` (nullable), `processor` (`stripe`), `processor_customer_id` unique, `created_at` — check: exactly one of the two FKs set | webhook / server |
| `commercial.subscriptions` | Current state of a subscription. One active per customer. | `id`, `customer_id` FK, `plan_code` FK, `price_id` FK, `status` (`trialing`, `active`, `past_due`, `canceled`, `paused`), `current_period_start/end`, `cancel_at`, `processor_subscription_id` unique | webhook only |
| `commercial.entitlement_grants` | Non-billing grants: comped seats, grants-funded access, hardship waivers. Lets `current_plan()` resolve a plan without a subscription. | `id`, `profile_id` FK, `plan_code`, `reason`, `granted_by` FK, `valid_from`, `valid_until`, `revoked_at` | admin, audited |
| `commercial.org_seats` | Professional plan membership: which profiles sit inside a paying organization's workspace. | `id`, `subscription_id` FK, `business_profile_id` FK, `profile_id` FK, `seat_role` (`owner`, `staff`), `added_by`, `added_at`, `removed_at` | org owner (RLS), admin |
| `commercial.processor_events` | Append-only mirror of every webhook received. Idempotency and audit. | `id`, `processor`, `event_id` unique, `event_type`, `payload` jsonb, `received_at`, `processed_at`, `error` | webhook only |
| `commercial.funding_disclosures` | Source for the public Funding page. Not tied to subscriptions; covers grants, sponsors, institutional partners. | `id`, `funder_name`, `funder_type`, `amount_range`, `period_start/end`, `restrictions`, `disclosed_at`, `is_public` | admin |

Deliberately **absent**:

- No `featured`, `boost`, `priority`, `placement`, or `rank` column anywhere.
- No link from `subscriptions` to `verification_status`, `trust_score`,
  `transparency_score`, or any moderation table.
- No product, inventory, order, or cart table. (AGENTS.md compliance
  boundary.)

---

## 3. Plan → limit mapping (reserved, not seeded)

Target values once the free tier has been observed for a month
(`entitlements-spec.md` §10). These are **starting hypotheses**, not
commitments.

| limit_key | free (seeded) | member (reserved) | supporter (reserved) | professional (reserved) |
| --- | --- | --- | --- | --- |
| `threads.new` / month | 2 | unlimited | unlimited | unlimited |
| `replies.hour` | 20 | 20 | 20 | 20 |
| `replies.day` | 100 | 100 | 100 | 100 |
| `ai.queries.month` | 10 | ~300 | ~300 | ~300 per seat |
| `ai.queries.day` | 3 | ~50 | ~50 | ~50 |
| Saved threads / follow alerts | no | yes | yes | yes |
| Data exports | own data only (exists) | own data | own data | org records + COA tooling |
| Right of reply on reports about the org | n/a | n/a | n/a | yes (already a BUSINESS capability; seat just scopes staff) |

Rate limits stay identical across plans on purpose. Paying does not buy the
right to flood.

Indicative prices for planning only (not seeded): Member $4.99/mo, Supporter
$15.99/mo (voluntary, same features as Member, funds the mission, listed on
the Funding page as "individual supporters"), Professional $49–$199/mo per
organization. Weekly billing is excluded: Stripe's 2.9% + 30¢ per card charge
(https://stripe.com/pricing) consumes roughly a quarter of a $1.33 charge.

---

## 4. The seam: `current_plan()`

Today (free-tier migration):

```sql
create or replace function public.current_plan(p_profile uuid)
returns text language sql stable security definer set search_path = '' as $$
  select 'free';
$$;
```

Later (commercial migration replaces the body only; signature and callers
unchanged):

```sql
-- precedence: active subscription > unexpired grant > org seat > free
select coalesce(
  (select s.plan_code from commercial.subscriptions s
     join commercial.customers c on c.id = s.customer_id
    where c.profile_id = p_profile and s.status in ('active','trialing')
    order by s.current_period_end desc limit 1),
  (select g.plan_code from commercial.entitlement_grants g
    where g.profile_id = p_profile and g.revoked_at is null
      and now() between g.valid_from and coalesce(g.valid_until, 'infinity')
    order by g.valid_until desc nulls first limit 1),
  (select 'professional' from commercial.org_seats o
     join commercial.subscriptions s on s.id = o.subscription_id
    where o.profile_id = p_profile and o.removed_at is null
      and s.status in ('active','trialing') limit 1),
  'free'
);
```

Because `check_entitlement`, `consume_ai_query`, and both triggers read
`current_plan()` and then look up `entitlement_limits`, **turning on a paid
plan is: (1) seed its limit rows, (2) swap this function body.** No route
code changes. That is the whole point of building the free tier this way.

---

## 5. Application surface (future)

| Route / module | Responsibility | Notes |
| --- | --- | --- |
| `POST /api/billing/checkout` | Create processor checkout session for a price | Server-only; requires AAL2 if MFA is enabled on the account |
| `POST /api/billing/portal` | Open processor customer portal (cancel, update card) | Never implement cancel ourselves; let the processor own it |
| `POST /api/billing/webhook` | Verify signature, insert `processor_events`, upsert `subscriptions` | Idempotent on `event_id`; service role; the only writer of `subscriptions` |
| `GET /api/billing/me` | Current plan, period end, seat list | Reads a `commercial.my_subscription` view |
| `/settings/plan` | UI for the above | Lives under the canonical `/settings` route; no new top-level nav |
| `/funding` | Public page rendered from `funding_disclosures` + aggregated supporter count | Never lists individual supporters by name without consent |
| `src/lib/entitlements.ts` | Typed wrappers for `my_entitlements()`, header builder | Exists from the free-tier work; unchanged |

Retire before launch: `src/app/api/membership/validate/route.ts`
(GoHighLevel tag lookup). Two membership sources of truth is one too many.

---

## 6. RLS and privilege sketch

| Table | `authenticated` | org owner | admin | service role |
| --- | --- | --- | --- | --- |
| `plans`, `prices` | select where `is_active` | — | all | all |
| `customers` | select own | — | select | all |
| `subscriptions` | select own (via view) | select org's | select | all (webhook) |
| `entitlement_grants` | select own | — | insert/update via audited fn | all |
| `org_seats` | select own seat | insert/update own org's seats (cap by plan) | all | all |
| `processor_events` | — | — | select | all |
| `funding_disclosures` | select where `is_public` (also `anon`) | — | all | all |

Default ACL for the schema: revoke all from `anon`, `authenticated`; grant
back the specific selects above. Same `TRUNCATE`/`TRIGGER`/`REFERENCES`
revocations as the public lock-down migration.

---

## 7. Processor and compliance notes

- Stripe prohibits "cannabis products" and "cannabis dispensaries and related
  businesses" (https://stripe.com/legal/restricted-businesses). The Green List
  sells nothing cannabis and facilitates no transaction, but **get written
  underwriting confirmation before building checkout**, and keep the public
  no-marketplace disclosure prominent on every billing page. Have a second
  processor identified as fallback.
- Statement descriptor should be neutral and recognizable
  (e.g. `GREENLIST MEMBER`), and the pre-checkout page should say what will
  appear on the card statement.
- Professional seats are sold to a licensed organization, not to a person.
  Require the `business_profiles` claim to be approved before a Professional
  subscription can attach to it. This is sequencing, not status-for-pay: the
  claim process is unchanged and free.
- Tax: digital subscription sales tax varies by state; use the processor's
  tax product rather than hand-rolling.
- Refund policy, cancellation terms, and the "what money does not buy" list
  must be on `/legal` before the first charge.

---

## 8. Sequencing

| Phase | Gate to enter | Work | Gate to exit |
| --- | --- | --- | --- |
| **0 — Free tier** (now) | Spec approved | `entitlements-spec.md` §7 migration, triggers, route wiring, UI counters, age gate | All 13 acceptance criteria pass on a Supabase branch of the production project |
| **1 — Observe** | Phase 0 in production | Nothing new. Read `entitlement_usage_monthly` weekly. | One full calendar month of data; cap-hit rate and AI p95 known |
| **2 — Member** | Processor underwriting confirmed in writing | Create `commercial` schema, `plans`/`prices`/`customers`/`subscriptions`/`processor_events`, webhook, swap `current_plan()`, seed `member` limits, `/settings/plan`, `/funding` | First real subscription survives renewal, cancel, and card-failure webhooks on a branch |
| **3 — Professional** | ≥ 3 approved business claims asking for staff accounts | `org_seats`, seat UI, org exports/COA tooling | A paying org can add and remove a staff seat without touching `profiles.role` |
| **4 — Supporter + grants** | Funding page live | `entitlement_grants` for comped/hardship/grant-funded access, supporter price | Funding page lists all institutional funders and an aggregate supporter count |

Phase 2 does not start on a calendar date. It starts when Phase 1's numbers
say the free limits are right and the processor says yes.

---

## Sources

- Stripe prohibited and restricted businesses: https://stripe.com/legal/restricted-businesses
- Stripe card pricing: https://stripe.com/pricing
- Reddit Premium pricing (consumer comparable): https://support.reddithelp.com/hc/en-us/articles/360043034412-What-is-a-Reddit-Premium-subscription
- Freemium community conversion benchmarks: https://startupfinancialprojection.com/blogs/kpis/online-community
- Platform compliance boundaries: `AGENTS.md` (Legal Compliance Boundaries)
- Role functions reused by the seam: `supabase/migrations/20260913071000_unify_role_system.sql`
