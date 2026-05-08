# Quick Reference Guide

## Common Commands

### Development

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Lint code
npm run lint
```

### Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database (dev)
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio (visual DB editor)
npm run db:studio
```

### DNS Management (Production)

```bash
# List current DNS records on Porkbun
npm run dns:list

# Setup DNS for Vercel deployment
npm run dns:setup-vercel

# Setup DNS for Clerk authentication
npm run dns:setup-clerk

# Setup all DNS records at once
npm run dns:setup-all
```

## Environment Setup

### First Time Setup

```bash
# Clone repository
git clone https://github.com/your-org/theblacklist.git
cd theblacklist

# Install dependencies
npm install

# Create environment file from template
cp .env.example .env.local

# Edit .env.local with your credentials
# (Clerk keys, Porkbun keys, Database URL, etc.)
nano .env.local

# Initialize database
npx prisma db push

# Start dev server
npm run dev
```

### Production Setup

```bash
# All credentials already in .env.local

# Install dependencies
npm install

# Build application
npm run build

# Setup DNS via Porkbun
npm run dns:setup-vercel

# Deploy to Vercel (via GitHub/Vercel UI)
# No terminal command needed - pushes to main branch trigger auto-deploy

# Verify production deployment
curl https://theblacklist.online/api/health
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Error

```bash
# Test connection string from .env.local
psql $DATABASE_URL

# Verify environment variables are set
echo $DATABASE_URL
```

### Prisma Client Not Found

```bash
# Regenerate Prisma client
npm run db:generate

# Or reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run db:generate
```

### DNS Records Not Resolving

```bash
# Check current DNS records
npm run dns:list

# Verify propagation
dig theblacklist.online A
dig www.theblacklist.online A

# Check nameservers
whois theblacklist.online | grep "Name Server"

# Should show: ns1.vercel-dns.com, ns2.vercel-dns.com
```

### Build Fails on Vercel

1. Check Vercel build logs: https://vercel.com/dashboard
2. Verify environment variables are set in Vercel dashboard
3. Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is marked as "Public"
4. Check for TypeScript errors: `npx tsc --noEmit`
5. Test build locally: `npm run build`

### Authentication Not Working

```bash
# Verify Clerk keys are set
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# Check Clerk dashboard for domain whitelist
# Should include: theblacklist.online, localhost:3000
```

## File Structure

```
TheBlacklist/
├── src/
│   ├── app/                  # Next.js routes and pages
│   │   ├── api/             # API endpoints
│   │   ├── products/        # Product pages
│   │   ├── dispensaries/    # Dispensary finder
│   │   └── reviews/         # Strain reviews
│   ├── components/          # React components
│   │   ├── product-gallery.tsx
│   │   └── product-forums.tsx
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   ├── types/               # TypeScript types
│   └── styles/              # Global styles
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── scripts/
│   ├── porkbun-dns.ts      # DNS configuration script
│   └── ...
├── public/                  # Static assets
├── .env.example            # Environment template
├── .env.local              # Local secrets (not in Git)
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── next.config.js          # Next.js config
├── tailwind.config.js      # Tailwind CSS config
├── DEPLOYMENT.md           # Deployment guide
├── PRODUCTION_READINESS.md # Pre-launch checklist
└── README.md               # Project overview
```

## Key Endpoints

### Public Routes

- `GET /` — Homepage
- `GET /products` — Product gallery
- `GET /products/[slug]` — Product detail
- `GET /products/[slug]/forum` — Product forum
- `GET /dispensaries` — Dispensary finder
- `GET /reviews` — Strain reviews
- `GET /about` — About page
- `GET /auth/sign-in` — Sign in page
- `GET /auth/sign-up` — Sign up page

### API Routes

- `GET /api/health` — Health check
- `GET /api/products` — Get products
- `GET /api/products/[id]` — Get product by ID
- `GET /api/dispensaries` — Get dispensaries
- `POST /api/reviews` — Create review (auth required)
- `POST /api/forum/posts` — Create forum post (auth required)

### Admin Routes (Protected)

- `GET /admin` — Admin dashboard
- `GET /admin/moderation` — Moderation queue
- `GET /admin/users` — User management
- `GET /admin/analytics` — Analytics dashboard

## Important URLs

- **Development:** http://localhost:3000
- **Production:** https://theblacklist.online
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Clerk Console:** https://dashboard.clerk.com
- **Porkbun:** https://porkbun.com
- **Supabase:** https://app.supabase.com
- **GitHub:** https://github.com

## Support Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Full deployment instructions
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — Pre-launch checklist
- [AGENTS.md](./AGENTS.md) — Architecture and coding standards
- [README.md](./README.md) — Project overview

---

## Environment Variables Needed

```env
# Required for production
NEXT_PUBLIC_SITE_URL=https://theblacklist.online
NEXT_PUBLIC_DOMAIN=theblacklist.online
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk1_...
CLERK_SECRET_KEY=sk1_...
PORKBUN_API_KEY=pk1_...
PORKBUN_API_SECRET=sk1_...
PORKBUN_DOMAIN=theblacklist.online
DATABASE_URL=postgresql://...

# Optional
OPENAI_API_KEY=sk-...
REDIS_URL=redis://...
```

---

**Last Updated:** January 2025  
**Platform Version:** 1.0.0  
**Next Steps:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
