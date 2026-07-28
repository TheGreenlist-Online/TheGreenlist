# Repository Assessment — Green List Town / OpenAI Integration

Assessment date: 2026-07-28
Branch: `feature/ai-service-town-guide`
Base commit: `ea45d33` ("Add role-based dashboard actions")

This document records what was found in the repository *before* any changes were
made, so that later reviewers can distinguish pre-existing conditions from work
introduced by this branch. The plan derived from it lives in
[`../IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md).

---

## 1. Repository structure

The repo is a single Next.js App Router application at the root. There is no
monorepo tooling and no `app/` or `lib/` directory at the root — everything
lives under `src/`, matching the convention documented in `AGENTS.md`.

```
src/
  app/            Next.js routes (App Router), incl. src/app/api/* route handlers
  components/     Shared UI + src/components/ui (shadcn-style primitives)
  config/         districts.ts  (only file)
  hooks/          (absent)
  lib/            db.ts, prisma.ts, openai.ts, roles.ts, utils.ts,
                  integrations/n8n.ts, supabase/{client,server,env,authz,proxy}.ts
  types/          index.ts (re-exports Prisma model types)
  utils/
prisma/           schema.prisma + 5 migration folders (raw SQL)
scripts/          build-safe.js, rss-ingestion.js, ai-summarization.js, porkbun-dns.ts
docs/             deployment.md, dns-setup.md, rbac.md, supabase-setup.md
.github/workflows/ci.yml
```

Path alias `@/*` → `./src/*` (`tsconfig.json`). TypeScript is `strict: true`.
ESLint is flat-config (`eslint.config.mjs`) extending `eslint-config-next/core-web-vitals`.

Confirmed conventions to follow (from `AGENTS.md` and observed code):
kebab-case files for routes, PascalCase for React components, `camelCase`
identifiers, `SCREAMING_SNAKE_CASE` env vars, Zod for payload validation,
strong typing with no `any`.

## 2. Authentication

**Supabase Auth is the live system.** `src/lib/supabase/` contains the full
implementation:

- `env.ts` — reads `NEXT_PUBLIC_SUPABASE_URL` and prefers
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` over the legacy
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Notably it already implements a
  **build-time placeholder** pattern (`isBuildTime()`) so that `next build`
  succeeds without Supabase credentials. This is the established precedent for
  "must build without secrets" and the new AI env validation mirrors it.
- `server.ts` — `createServerClient` from `@supabase/ssr` bound to Next
  `cookies()`. This client carries the caller's session, so **all queries made
  through it are subject to RLS as that user**. This is the correct primitive
  for AI tools.
- `client.ts` — browser client.
- `authz.ts` — `getCurrentPrincipal()` returns `{ supabase, user, role,
  isPlatformOwner }`, reading `profiles.role` and the
  `app_metadata.platform_owner` JWT claim. `requirePermission()` /
  `requireAdmin()` build on it.
- `roles.ts` — `PLATFORM_ROLES` (`USER`, `BUSINESS`, `DISTRIBUTOR`,
  `CULTIVATOR`, `MODERATOR`, `ADMIN`) and a permission matrix
  (`business:manage`, `content:moderate`, `forum:manage`, `platform:admin`,
  `roles:manage`).

There is **no service-role key in use anywhere in `src/`** — verified by grep.
The only references are commented-out placeholders in `.env.example`.

### Legacy NextAuth / Prisma remnants

Prisma is **not** dead code and must not be removed wholesale:

| File | Prisma usage | Verdict |
|---|---|---|
| `src/lib/prisma.ts` | exports `PrismaClient` singleton | live |
| `src/lib/db.ts` | byte-identical duplicate of `prisma.ts` | duplicate, but imported nowhere — left alone (out of scope) |
| `src/app/api/health/route.ts` | `prisma.$queryRaw\`SELECT 1\`` | live |
| `src/app/api/health/auth/route.ts` | `$queryRaw` + `prisma.user.count()` | live |
| `src/types/index.ts` | imports ~19 model types from `@prisma/client` | live — widely re-exported |

NextAuth remnants exist only at the **database** layer (the
`20260617162000_auth_roles_nextauth` migration and the `accounts` / `sessions` /
`verification_tokens` tables plus `User.password`). No `next-auth` package is
installed and no application code imports it. `.env.example` marks the Google
and Apple OAuth vars "Deprecated ... use Supabase dashboard to configure".

**Decision: no Prisma/NextAuth removal on this branch.** The directive says not
to perform broad removals until usages are identified; the usages above are real
and removing them is a separate, independently reviewable change. Ripping out
`@prisma/client` would break `src/types/index.ts` and both health routes, and
would require editing `scripts/build-safe.js`. Recorded as a follow-up
milestone instead.

## 3. Supabase clients and environment validation

Environment handling is currently **ad-hoc and per-consumer**: `supabase/env.ts`
validates Supabase vars, `lib/openai.ts` does a bare `process.env.OPENAI_API_KEY`
check, and feature flags (`ENABLE_AI_MODERATION`, `ENABLE_FORUMS`,
`ENABLE_REVIEWS`) are declared in `.env.example` but read nowhere in `src/`.

There is no central env schema. The AI work adds one scoped to AI
(`src/lib/ai/config.ts`) rather than refactoring Supabase env handling, to keep
the blast radius small.

## 4. Existing routes, APIs, schemas, migrations, storage

### Route handlers (`src/app/api/`)

| Route | Notes |
|---|---|
| `ai/route.ts` | **Pre-existing minimal AI endpoint.** Uses `chat.completions` with a hardcoded `gpt-4o-mini`, no auth, no Zod validation, no rate limit, no audit. Returns free text. |
| `forums/route.ts`, `posts/route.ts`, `register/route.ts` | app APIs |
| `health/route.ts`, `health/auth/route.ts` | Prisma-backed health checks |
| `integrations/n8n/test/route.ts` | n8n smoke test |

`src/app/api/ai/route.ts` is the only existing AI surface. It is **kept
working and unchanged in behaviour** (it is a public documented endpoint) but is
now marked deprecated in docs, and the new endpoints live under
`/api/ai/<feature>`.

### Migrations vs. the live database — IMPORTANT DIVERGENCE

`prisma/migrations/` contains 5 folders of raw SQL. The live Supabase project
(`idtnlninotxwqpznbwur`) reports **~78 migrations**. The repository's migration
history is therefore **a partial, stale mirror of production, not the source of
truth.** Concrete evidence of divergence:

| Repo migration says | Live database has |
|---|---|
| `public.evidence` | `evidence_files` (2 rows) |
| `profiles.public_profile` (created 20260703) | `profiles.is_public` (referenced by the 20260722 hardening policy in this same repo) |
| no `forum_threads` | `forum_threads` exists |
| no `education_resources` | `education_resources` exists (added 2026-07-16) |
| no `moderation_queue*` | `moderation_queue`, `moderation_queue_items`, `moderation_batches` exist |
| no `user_roles`, `nda_signatures`, `notifications`, `support_tickets` | all exist |

Tables whose shape *is* reliably known from repo SQL: `profiles`, `reports`,
`business_profiles`, `audit_logs`, `forum_posts`, `forum_comments`,
`dashboard_preferences`, `content_submissions`.

**This drives a core design decision** (see the plan): every AI data tool must
degrade gracefully when a table or column is missing, rather than throwing.
A tool that cannot read its table returns "no results" and records an
`unavailable` note — it never 500s the request and never leaks the DB error to
the client.

`audit_logs` shape (known): `id, user_id, action, resource_type, resource_id,
changes jsonb, created_at`. The 20260722 hardening added an `actor_id` index,
implying production has drifted here too.

### Storage

Evidence uploads target a private `evidence` bucket (policies are commented out
in the 20260703 migration, so the live bucket policy was applied out-of-band).
No AI feature on this branch reads Storage.

## 5. Current `/town` state

`/town` is a **single static page**, `src/app/town/page.tsx` (86 lines):

- Renders a hero + a CSS-grid "map" of 8 district cards + a "Your Base Is
  Coming" teaser.
- Data comes from `src/config/districts.ts` — an 8-entry `as const` array with
  `{ id, name, description, href, icon, position, availability, featured? }`.
- No sub-routes exist (`/town/map`, `/town/forum`, … are all absent).
- No AI, no auth-awareness, no per-location access model.

`districts.ts` is close to, but not compatible with, the location shape the
directive mandates (`townHref`/`standardHref`/`access`/`visibility` are all
missing; `href` conflates the two interfaces). It is also `as const`, and
`town/page.tsx` derives its icon map type from it, so widening it needs care.

No Green List Town epic, issue tracker export, or design doc exists in `docs/`
or the README.

### Existing view switcher

`src/components/SiteHeader.tsx` **already has** a Standard/Town toggle (desktop
nav + mobile menu). It is a naive `pathname.startsWith('/town') ? '/' : '/town'`
— it discards the current record context and query string entirely. This is the
thing the directive's "switcher must preserve context" requirement is about; it
needs a real route-mapping layer rather than a new component from scratch.

## 6. Build and CI configuration

- `package.json` → `"build": "node scripts/build-safe.js"`. That script runs
  `prisma generate` (hard-fails the build if it errors) then `next build`.
- **`"test": "prisma validate 2>/dev/null || true"` — there is no test runner
  and no test file in the repository.** `npm test` currently always exits 0 and
  asserts nothing.
- `"lint": "eslint ."`
- No `vercel.json`. Vercel project settings supply the config (Next.js preset,
  Node 24.x, root `.`).
- Package manager: `package-lock.json` only → **npm**.
- `.github/workflows/ci.yml` exists.
- `tsconfig.tsbuildinfo` is committed to the repo (incremental build artifact —
  pre-existing, should be gitignored, not addressed here).
- `fix-pages.py` is a stray one-off script at the repo root (pre-existing).

Relevant already-installed dependencies — **nothing new is needed for the AI
work**: `openai@^4.11.0`, `zod@^4.4.0`, `@supabase/ssr@^0.10.3`,
`@supabase/supabase-js@^2.38.4`, `next@16.2.6`, `react@^19.2.0`.

Note `openai@^4` resolves to the v4 SDK line. The v4 SDK **does** expose
`client.responses.create(...)`, so the directive's "use the Responses API, not
the legacy Assistants API" requirement is satisfiable without a major-version
bump. Structured output is requested via `text.format` with a JSON schema.

## 7. Pre-existing issues noted (not introduced by this branch)

1. `npm test` is a no-op — no test runner installed.
2. `src/lib/db.ts` duplicates `src/lib/prisma.ts` verbatim; nothing imports `db.ts`.
3. Repo migration history is stale relative to production (section 4).
4. `tsconfig.tsbuildinfo` is committed.
5. Feature flags in `.env.example` (`ENABLE_AI_MODERATION`, `ENABLE_FORUMS`,
   `ENABLE_REVIEWS`) are never read by application code.
6. `src/app/api/ai/route.ts` has no authentication, validation, rate limiting or
   audit trail.
7. Supabase advisor reports one WARN: *Leaked Password Protection Disabled*
   (an auth dashboard setting, not fixable from this repository).

## 8. Constraints carried into the plan

- Production DB holds live sensitive data (`reports` = 1 row, `evidence_files` =
  2 rows). No exploratory or destructive SQL against production.
- Migrations from 2026-07-16 to 2026-07-22 are deliberate RLS/security
  hardening. New SQL must be **purely additive**; no existing policy may be
  loosened.
- `OPENAI_API_KEY` and the Supabase service-role key must never reach client
  code, model context, logs, or API responses.
- The app must build and the UI must render with **no** AI configuration present.
