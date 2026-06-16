# Deployment Guide

This guide covers deploying The Green List to production.

Primary domain: `https://thegreenlist.online`
Secondary domain: `https://greenlist.online`

## Vercel Deployment

### Prerequisites
- Vercel account
- Porkbun access for `thegreenlist.online` and `greenlist.online`
- Supabase/PostgreSQL project set up
- Production environment variables ready

### Steps

1. **Connect Repository**
   - Import the GitHub repository to Vercel
   - Configure the project as a Next.js app

2. **Environment Variables**
   - Add all variables from `.env.example`
   - Use Vercel environment variables for sensitive data
   - Set `NEXT_PUBLIC_SITE_URL=https://thegreenlist.online`
   - Set `NEXTAUTH_URL=https://thegreenlist.online` if NextAuth is used

3. **Database**
   - Use Supabase/PostgreSQL
   - Run Prisma migrations or schema push according to the release plan

4. **Domain Configuration**
   - Add `thegreenlist.online` as the primary production domain in Vercel
   - Add `greenlist.online` as the secondary/backup domain
   - Configure Porkbun DNS records as described in `docs/dns-setup.md`

5. **SSL & Security**
   - Vercel provides automatic SSL
   - Configure CSP and other security headers before production launch

## Docker Deployment

### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/TheBlacklistOnline/TheBlacklist.git
cd TheBlacklist

# Copy environment file
cp .env.example .env.local

# Start services
docker-compose -f docker/docker-compose.yml up -d
```

### Manual Docker Build

```bash
docker build -t thegreenlist .
docker run -p 3000:3000 --env-file .env.local thegreenlist
```

## Environment Variables Checklist

### Required
- [ ] `DATABASE_URL`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Optional
- [ ] `OPENAI_API_KEY`
- [ ] `RESEND_API_KEY` or `SENDGRID_API_KEY`
- [ ] `REDIS_URL`

## Auth and Supabase Redirects

Allow these URLs in auth provider and Supabase redirect settings where applicable:

```text
https://thegreenlist.online
https://greenlist.online
https://thegreenlist.online/auth/callback
https://greenlist.online/auth/callback
http://localhost:3000
http://localhost:3000/auth/callback
```

Only include callback paths that are actually used by the app.

## Post-Deployment Tasks

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Data** (optional)
   ```bash
   npx prisma db seed
   ```

3. **Test Functionality**
   - User registration/login
   - Forum navigation
   - Report pages
   - News pages
   - Public legal/support pages

4. **Monitoring Setup**
   - Configure Vercel Analytics
   - Set up error tracking such as Sentry
   - Monitor database performance

5. **Backup Configuration**
   - Set up automated database backups
   - Configure backup retention

## Scope Guardrails

The Green List is not a cannabis marketplace. Production deployments must not add cannabis sales, ordering, delivery, checkout, payment processing, inventory, or dispensary transaction features.
