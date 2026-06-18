# Auth Setup

The Green List uses NextAuth with Prisma and PostgreSQL/Supabase.

## Canonical Routes

- Sign in: `/auth/signin`
- Register: `/auth/register`
- Dashboard: `/dashboard`

Legacy routes redirect to the canonical routes:

- `/sign-in`, `/signin`, `/login` -> `/auth/signin`
- `/sign-up`, `/signup`, `/register` -> `/auth/register`

## Required Environment Variables

Local development:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
DATABASE_URL=postgresql://username:password@localhost:5432/thegreenlist
```

Production:

```env
NEXTAUTH_URL=https://thegreenlist.online
NEXTAUTH_SECRET=
DATABASE_URL=
```

Generate a long random `NEXTAUTH_SECRET` for each deployed environment. Do not expose `NEXTAUTH_SECRET`, `DATABASE_URL`, or `SUPABASE_SERVICE_ROLE_KEY` to the browser.

Only variables prefixed with `NEXT_PUBLIC_` are safe for client-side use.

## Providers

Credentials auth is available when the database is configured. Passwords are hashed with bcrypt before storage and password hashes are never returned to the client.

OAuth buttons are shown only when NextAuth reports configured OAuth providers.

Optional provider variables:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_ID=
APPLE_SECRET=
```

OAuth callback URLs use the NextAuth callback route:

- Local Google: `http://localhost:3000/api/auth/callback/google`
- Production Google: `https://thegreenlist.online/api/auth/callback/google`
- Local Apple: `http://localhost:3000/api/auth/callback/apple`
- Production Apple: `https://thegreenlist.online/api/auth/callback/apple`

## Registration Rules

New users always default to `USER`.

Registration does not accept client-controlled protected fields, including `ADMIN`, `BUSINESS`, `DISTRIBUTOR`, `CULTIVATOR`, `verified`, `trustScore`, `transparencyScore`, `reputation`, `moderationStatus`, `businessId`, or admin permissions.

Registration and login failures use generic client-facing messages.

## Protected Routes

Unauthenticated users are redirected to `/auth/signin` for:

- `/dashboard`
- `/profile`
- `/settings`
- `/business/dashboard`
- `/admin`
- `/admin/*`

Admin pages also check the server-side session role and return a clean not-found response for non-admin users.

## Common Login Failure Checklist

- `NEXTAUTH_URL` missing or wrong
- `NEXTAUTH_SECRET` missing
- `DATABASE_URL` missing or invalid
- Prisma client not generated
- Prisma auth models missing
- `/api/auth/[...nextauth]` route missing
- signin page route mismatch
- register page route mismatch
- middleware redirect loop
- OAuth callback URL mismatch
- `SessionProvider` missing for client `useSession()`
- user role missing from session callback
- password not hashed

## Local Validation

Run:

```bash
npm install
npx prisma validate
npx prisma generate
npm run typecheck
npm run lint
npm run build
npm run smoke:auth
```

`npm run smoke:auth` expects a running app. Set `BASE_URL` to test another environment:

```bash
BASE_URL=https://thegreenlist.online npm run smoke:auth
```
