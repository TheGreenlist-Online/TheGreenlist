# Quick Reference Guide

## Common Commands

### Development

```bash
npm run dev
npm run build
npm start
npm run lint
```

### Database

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
npx prisma validate
```

### DNS Management

```bash
npm run dns:list
npm run dns:setup-vercel
npm run dns:setup-clerk
npm run dns:setup-all
```

## Environment Setup

```bash
git clone https://github.com/TheBlacklistOnline/TheBlacklist.git
cd TheBlacklist
npm install
cp .env.example .env.local
npx prisma db push
npm run dev
```

## Production URLs

- Development: `http://localhost:3000`
- Primary production: `https://thegreenlist.online`
- Secondary production: `https://greenlist.online`
- Vercel Dashboard: `https://vercel.com/dashboard`
- Porkbun: `https://porkbun.com`
- Supabase: `https://app.supabase.com`

## Environment Variables Needed

```env
NEXT_PUBLIC_SITE_URL=https://thegreenlist.online
NEXT_PUBLIC_DOMAIN=thegreenlist.online
NEXT_PUBLIC_SECONDARY_DOMAIN=greenlist.online
NEXTAUTH_URL=https://thegreenlist.online
NEXTAUTH_SECRET=replace-with-production-secret
PORKBUN_DOMAIN=thegreenlist.online
DATABASE_URL=postgresql://...
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Auth and Supabase Redirects

Allow these URLs where applicable:

```text
https://thegreenlist.online
https://greenlist.online
https://thegreenlist.online/auth/callback
https://greenlist.online/auth/callback
http://localhost:3000
http://localhost:3000/auth/callback
```

## Public Routes

- `GET /` - Homepage
- `GET /forums` - Forums hub
- `GET /businesses` - Business transparency directory concept
- `GET /news` - News hub
- `GET /reports` - Reports hub
- `GET /report` - Report issue/intake page
- `GET /api-docs` - API docs placeholder
- `GET /contact` - Contact page
- `GET /legal` - Legal hub
- `GET /auth/signin` - Sign in page
- `GET /auth/signup` - Sign up page

## Scope Guardrails

The Green List is for cannabis transparency, accountability, education, reporting, news, forums, and community trust only.

Do not add cannabis sales, ordering, delivery, checkout, payment processing, inventory, or dispensary transaction features.

## Support Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment instructions
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) - Pre-launch checklist
- [AGENTS.md](./AGENTS.md) - Architecture and coding standards
- [README.md](./README.md) - Project overview

Last updated: June 2026
Platform version: 1.0.0
