# Deployment Notes

## Vercel Environment Variables

Set these variables in Vercel for Production, Preview, and Development as appropriate:

```env
NEXTAUTH_URL=https://thegreenlist.online
NEXTAUTH_SECRET=
DATABASE_URL=
NEXT_PUBLIC_SITE_URL=https://thegreenlist.online
NEXT_PUBLIC_DOMAIN=thegreenlist.online
NEXT_PUBLIC_SECONDARY_DOMAIN=greenlist.online
```

If Supabase client or storage features are enabled:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `NEXTAUTH_SECRET` are server-only. Do not prefix them with `NEXT_PUBLIC_`.

## OAuth Providers

Only configure OAuth providers that are actually used.

Google:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Callback URL:

```text
https://thegreenlist.online/api/auth/callback/google
```

Apple:

```env
APPLE_ID=
APPLE_SECRET=
```

Callback URL:

```text
https://thegreenlist.online/api/auth/callback/apple
```

Add equivalent callback URLs for preview or local environments only when those environments need OAuth testing.

## Database and Prisma

The app expects PostgreSQL via Prisma. Before deploying, confirm:

```bash
npx prisma validate
npx prisma generate
```

For production schema changes, use reviewed migrations. Do not run destructive migrations against production.

## Auth Flow Expectations

- `/auth/signin` loads the login form.
- `/auth/register` loads the registration form.
- Legacy auth paths redirect to canonical auth paths.
- Logged-out `/dashboard` requests redirect to `/auth/signin`.
- Logged-out `/admin` requests redirect to `/auth/signin`.
- Non-admin users receive a protected not-found response for admin routes.
- Successful credentials login lands on `/dashboard` unless a safe internal `callbackUrl` is supplied.

## Smoke Test

After deployment, run:

```bash
BASE_URL=https://thegreenlist.online npm run smoke:auth
```

The smoke test checks:

- `/`
- `/auth/signin`
- `/auth/register`
- `/dashboard`
- `/api/auth/session`

## Compliance Boundary

The deployed site must remain a transparency, accountability, reporting, news, forum, education, and analytics platform. Do not add cannabis sales, ordering, delivery, checkout, payments, fulfillment, inventory, dispensary menus, or transaction workflows.
