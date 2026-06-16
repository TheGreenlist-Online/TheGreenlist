# Deployment Guide for The Green List

This guide walks through deploying the platform to production.

Primary domain: `https://thegreenlist.online`
Secondary domain: `https://greenlist.online`
Registrar: Porkbun
Hosting: Vercel

## Prerequisites

- [ ] Porkbun access for `thegreenlist.online` and `greenlist.online`
- [ ] Vercel account connected to the GitHub repository
- [ ] Supabase/PostgreSQL database
- [ ] Auth provider credentials configured where used
- [ ] Required environment variables ready

## Step 1: Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Minimum production values:

```env
NEXT_PUBLIC_SITE_URL=https://thegreenlist.online
NEXT_PUBLIC_DOMAIN=thegreenlist.online
NEXT_PUBLIC_SECONDARY_DOMAIN=greenlist.online
NEXTAUTH_URL=https://thegreenlist.online
NEXTAUTH_SECRET=replace-with-production-secret
PORKBUN_DOMAIN=thegreenlist.online
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres"
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Never commit `.env.local` or real secrets.

## Step 2: Configure Domains

In Vercel:

1. Add `thegreenlist.online` as the primary production domain
2. Add `greenlist.online` as the secondary/backup domain
3. Add `www` variants only if needed
4. Confirm SSL is active for all public domains

In Porkbun, configure DNS according to `docs/dns-setup.md` or Vercel's current dashboard instructions.

## Step 3: Configure Auth and Supabase Redirects

Allow these URLs in auth provider and Supabase redirect settings where applicable:

```text
https://thegreenlist.online
https://greenlist.online
https://thegreenlist.online/auth/callback
https://greenlist.online/auth/callback
http://localhost:3000
http://localhost:3000/auth/callback
```

Only include callback paths that the app actually uses.

## Step 4: Setup Database

Use Supabase/PostgreSQL for production.

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

For development-only schema sync, use:

```bash
npx prisma db push
```

## Step 5: Deploy to Vercel

1. Import the repository in Vercel
2. Set framework to Next.js
3. Use `npm install` as the install command
4. Use `npm run build` as the build command
5. Add all production environment variables
6. Deploy and review build logs

## Step 6: Verify Production

```bash
curl -I https://thegreenlist.online
curl -I https://greenlist.online
curl -I https://thegreenlist.online/api/health
```

Also verify:

- Homepage loads with The Green List branding
- Sign-in/sign-up routes work
- Forums, news, reports, report, businesses, contact, and legal pages load
- No public page suggests cannabis sales, ordering, delivery, checkout, payments, inventory, or dispensary transactions
- SSL certificates are valid

## Troubleshooting

### DNS Not Resolving

1. Wait for propagation
2. Verify Porkbun DNS records
3. Confirm Vercel domain status
4. Check both primary and secondary domains

### Authentication Not Working

1. Verify `NEXTAUTH_URL` uses `https://thegreenlist.online`
2. Verify provider redirect URLs include the new domains
3. Confirm secrets and OAuth credentials are set in Vercel

### Database Connection Errors

1. Verify `DATABASE_URL`
2. Run `npx prisma validate`
3. Confirm Supabase project status
4. Check Vercel runtime logs

## Scope Guardrails

The Green List is a cannabis transparency, accountability, education, reporting, news, forum, and community trust platform. It is not a cannabis marketplace and must not add cannabis sales, ordering, delivery, checkout, payment processing, inventory, or dispensary transaction features.
