# Deployment Guide for THEBLACKLIST.ONLINE

This guide walks through deploying the platform to production at `theblacklist.online`.

## Prerequisites

- [ ] Porkbun account with API credentials configured in `.env.local`
- [ ] Vercel account (deploy frontend)
- [ ] PostgreSQL database (Supabase recommended for ease)
- [ ] Clerk authentication account with keys in `.env.local`
- [ ] Domain `theblacklist.online` registered and pointing to Porkbun nameservers

## Step 1: Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Update `.env.local` with:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk1_...
CLERK_SECRET_KEY=sk1_...

# Porkbun Domain Management
PORKBUN_API_KEY=pk1_...
PORKBUN_API_SECRET=sk1_...
PORKBUN_DOMAIN=theblacklist.online

# Database (use Supabase for production)
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres"

# Optional services
OPENAI_API_KEY=sk-...
REDIS_URL=redis://...
```

**⚠️ Security Note:** Never commit `.env.local` to Git. The file is protected in `.gitignore`.

## Step 2: Setup DNS Records via Porkbun

The platform includes automated DNS configuration scripts. Install dependencies first:

```bash
npm install
```

### List Current DNS Records

```bash
npm run dns:list
```

### Setup for Vercel Deployment

```bash
npm run dns:setup-vercel
```

This will:
- Configure A records pointing to Vercel's infrastructure
- Setup CNAME records for subdomains (e.g., `api.theblacklist.online`)
- Set TTL to 3600 seconds for quick propagation

### Verify DNS Propagation

After running the script, verify DNS is propagating:

```bash
# Check A record
dig theblacklist.online A

# Check www subdomain
dig www.theblacklist.online A

# Check api subdomain
dig api.theblacklist.online CNAME
```

DNS typically propagates within 5-30 minutes. Wait for all records to show correct values before deploying.

## Step 3: Setup Database

### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the PostgreSQL connection string
4. Add to `.env.local`:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
```

5. Initialize database schema:

```bash
npx prisma migrate deploy
# or for development:
npx prisma db push
```

### Option B: Self-Hosted PostgreSQL

If using a self-hosted PostgreSQL instance, ensure:
- Database is accessible from Vercel
- Connection pool is configured (PgBouncer recommended)
- SSL certificates are valid
- Backups are automated

## Step 4: Deploy to Vercel

### Connect GitHub Repository

1. Push code to GitHub:

```bash
git push origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import the GitHub repository
5. Configure build settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Configure Environment Variables in Vercel

Go to **Settings → Environment Variables** and add all variables from `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
PORKBUN_API_KEY
PORKBUN_API_SECRET
PORKBUN_DOMAIN
DATABASE_URL
OPENAI_API_KEY
```

**✅ IMPORTANT:** Make sure `NEXT_PUBLIC_*` variables are marked as "Public" in Vercel.

### Deploy

Click "Deploy" and monitor the build logs. The deployment should:
1. Install dependencies
2. Build Next.js app
3. Generate Prisma client
4. Deploy to Vercel CDN

Once complete, your site will be live at `https://theblacklist.online`

## Step 5: Verify Production Setup

### Health Checks

```bash
# Check homepage loads
curl -I https://theblacklist.online

# Check API is responding
curl -I https://theblacklist.online/api/health

# Check Clerk is connected
curl https://theblacklist.online/auth/sign-in
```

### DNS Verification

Ensure nameservers point to Vercel:

```bash
whois theblacklist.online | grep -i "name server"
```

Should show Vercel nameservers (ns1.vercel-dns.com, etc.)

### SSL Certificate

HTTPS should be automatically provisioned by Vercel. Verify:

```bash
curl -I https://theblacklist.online
# Should show: HTTP/2 200 and have valid SSL
```

## Step 6: Configure Custom Domain in Porkbun

1. Log into Porkbun
2. Go to **Domains → theblacklist.online**
3. Click **Nameservers**
4. Set to Vercel nameservers:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com

5. Save changes

Propagation typically takes 24-48 hours for all nameservers to update globally.

## Step 7: Database Schema and Initial Data

### Initialize Database Schema

```bash
npx prisma migrate deploy
```

### Seed Initial Data (Optional)

Create a seed script at `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add initial data here
  console.log('Database seeded')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

Run seed:

```bash
npx prisma db seed
```

## Step 8: Enable Features

### Clerk Configuration

1. Go to [clerk.com](https://clerk.com)
2. Select your application
3. Go to **Instances → Clerk API**
4. Verify keys are in `.env.local` and Vercel

### Content Moderation (Optional)

If using OpenAI for content moderation:

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add to `.env.local` and Vercel: `OPENAI_API_KEY=sk-...`

## Step 9: Monitoring and Maintenance

### Vercel Dashboard

Monitor deployment health at [vercel.com/dashboard](https://vercel.com/dashboard):
- Real-time logs
- Performance metrics
- Build history
- Deployments

### Database Backups

Use Supabase's automated backups or set up AWS RDS backups for self-hosted PostgreSQL.

### SSL Certificate Renewal

Vercel automatically renews SSL certificates. No action needed.

## Troubleshooting

### DNS Not Resolving

**Problem:** `dig theblacklist.online` shows wrong IP

**Solution:**
1. Wait 24-48 hours for propagation
2. Log into Porkbun and verify nameservers
3. Run `npm run dns:list` to verify DNS records were created
4. Check Vercel's nameserver configuration

### 502 Bad Gateway

**Problem:** Requests to theblacklist.online return 502

**Solution:**
1. Check Vercel build logs for compilation errors
2. Verify `DATABASE_URL` is correct and accessible
3. Check Clerk keys are valid
4. Look at Vercel function logs in dashboard

### Clerk Authentication Not Working

**Problem:** Sign-in page not loading or authentication fails

**Solution:**
1. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
2. Verify `CLERK_SECRET_KEY` is set on backend
3. Check Clerk dashboard for domain whitelist
4. Ensure redirect URIs include `https://theblacklist.online`

### Database Connection Errors

**Problem:** "Cannot reach database" errors in logs

**Solution:**
1. Verify `DATABASE_URL` in `.env.local` is correct
2. Test connection locally: `npx prisma db execute --stdin < /dev/null`
3. Check Supabase network settings allow Vercel IPs
4. Verify SSL certificates if using self-hosted PostgreSQL

## Rollback Procedure

### Rollback to Previous Deployment

1. Go to [vercel.com/deployments](https://vercel.com/deployments)
2. Find the previous successful deployment
3. Click the three dots menu
4. Select "Redeploy"

### Rollback Database

Supabase provides point-in-time recovery:

1. Go to Supabase Dashboard
2. Go to **Database → Backups**
3. Select restore point
4. Follow restore instructions

## Production Checklist

- [ ] DNS records configured and propagating
- [ ] Vercel deployment successful with no build errors
- [ ] Database initialized and accessible
- [ ] Clerk authentication working on production domain
- [ ] HTTPS certificate valid
- [ ] Homepage loads with correct styling
- [ ] Forums and product galleries render
- [ ] Authentication flows work end-to-end
- [ ] Admin panel accessible to authorized users
- [ ] Environment variables secure in Vercel (not in Git)
- [ ] Monitoring/logging configured
- [ ] Backups automated
- [ ] Privacy policy and legal pages updated
- [ ] Error pages (404, 500) properly styled

## Next Steps

Once deployed:

1. **Content Moderation Setup** — Configure AI moderation rules in admin panel
2. **Affiliate Links** — Set up affiliate tracking for sponsored content
3. **Analytics** — Connect Vercel Analytics and error tracking
4. **Email Service** — Configure Resend or SendGrid for notifications
5. **Forum Moderation** — Train moderators on community guidelines
6. **SEO Optimization** — Submit sitemap to Google Search Console

## Support

For issues or questions:

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Clerk Docs: https://clerk.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Porkbun API: https://porkbun.com/api/json/v3/documentation
