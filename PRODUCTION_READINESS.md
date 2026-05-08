# Production Readiness Checklist

Before deploying THEBLACKLIST.ONLINE to production, verify all items below are complete.

## 🔐 Security & Secrets

- [ ] All API keys are in `.env.local` (never committed to Git)
- [ ] `.gitignore` protects `.env.local`, `.next`, build artifacts
- [ ] Clerk authentication keys are valid and tested
- [ ] Porkbun API credentials have appropriate permissions (DNS management only)
- [ ] Database connection string uses SSL/TLS (`?sslmode=require`)
- [ ] No hardcoded secrets in source code
- [ ] CORS headers configured for `theblacklist.online` only
- [ ] Rate limiting enabled on all public API endpoints
- [ ] Content Security Policy (CSP) headers configured

## 🌐 Domain & DNS

- [ ] Domain `theblacklist.online` registered at Porkbun
- [ ] DNS records created via `npm run dns:setup-vercel`
- [ ] Nameservers point to Vercel (ns1.vercel-dns.com, ns2.vercel-dns.com)
- [ ] DNS propagation verified globally (use `dig` or `nslookup`)
- [ ] A records resolve to Vercel IP (76.76.19.165)
- [ ] CNAME records for subdomains configured (api, admin, etc.)
- [ ] Email DNS records configured (MX, SPF, DKIM) if email enabled
- [ ] SSL/TLS certificate auto-provisioned by Vercel

## 📊 Database

- [ ] PostgreSQL database created (Supabase recommended)
- [ ] `DATABASE_URL` environment variable configured
- [ ] Database connection tested from Vercel environment
- [ ] All Prisma migrations applied: `npx prisma migrate deploy`
- [ ] Database schema validated with `npx prisma validate`
- [ ] Backups enabled and tested
- [ ] Connection pooling configured (PgBouncer for self-hosted)
- [ ] SSL certificates valid and updated
- [ ] `vacuum` and `analyze` scheduled for optimization

## 🔑 Authentication (Clerk)

- [ ] Clerk application created and API keys obtained
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` set in environment
- [ ] `CLERK_SECRET_KEY` set in environment (server-side only)
- [ ] Clerk domain configuration includes `theblacklist.online`
- [ ] Sign-in/sign-up flows tested end-to-end
- [ ] User profile pages working correctly
- [ ] OAuth providers configured (Google/Apple if desired)
- [ ] Clerk webhook configured for user events (optional)

## 🚀 Deployment (Vercel)

- [ ] GitHub repository pushed to main branch
- [ ] Vercel project created and connected to GitHub
- [ ] Build command set to `npm run build`
- [ ] Environment variables configured in Vercel dashboard
- [ ] All `NEXT_PUBLIC_*` variables marked as "Exposed to Browser"
- [ ] Install command: `npm install`
- [ ] Build settings match: Framework = Next.js, Output = `.next`
- [ ] First production build successful (no errors)
- [ ] Site loads at `https://theblacklist.online`
- [ ] HTTPS working with valid certificate

## 🎨 UI/UX & Content

- [ ] Homepage renders with correct dark green/black theme
- [ ] Product gallery revolves correctly
- [ ] Product forums load without errors
- [ ] Product detail pages display cannabinoid info
- [ ] Dispensary finder filters and sorts correctly
- [ ] Strain reviews display with ratings
- [ ] Responsive design works on mobile (tested on multiple devices)
- [ ] All interactive components functional (buttons, forms, dropdowns)
- [ ] Loading states and error states display properly
- [ ] Animations (Framer Motion) perform smoothly
- [ ] No console errors or warnings in browser DevTools
- [ ] Accessibility: keyboard navigation works, ARIA labels present
- [ ] Dark mode colors match brand: Deep green (#2d5a3d → #4a8f5e), blacks (#0f1419), reds (#c41e3a), yellows (#f4d03f)

## 📝 Legal & Compliance

- [ ] Privacy Policy page created and linked in footer
- [ ] Terms of Service page created and linked in footer
- [ ] Cannabis compliance disclaimer visible on key pages
- [ ] No direct commerce/sales features implemented
- [ ] No unverified medical claims in product descriptions
- [ ] Affiliate links/sponsored content clearly labeled
- [ ] FTC disclosures in place for any affiliate content
- [ ] Anti-defamation safeguards for user reports implemented
- [ ] Moderation guidelines documented and accessible
- [ ] Age verification implemented if required by jurisdiction

## 🔍 Monitoring & Logging

- [ ] Error logging configured (Sentry recommended)
- [ ] Analytics enabled (Vercel Analytics)
- [ ] Health check endpoint working: `GET /api/health`
- [ ] Database query performance monitored
- [ ] Uptime monitoring configured
- [ ] Alert notifications set up for critical errors
- [ ] Log retention policy configured
- [ ] Sensitive data (PII) not logged

## 📧 Email & Notifications (if enabled)

- [ ] Email service configured (Resend, SendGrid, or Postmark)
- [ ] API key stored in environment variables
- [ ] Test emails sent and received successfully
- [ ] Email templates styled and branded
- [ ] Unsubscribe links included in all emails
- [ ] Bounce/complaint handling configured

## 🐳 Docker & CI/CD

- [ ] Dockerfile created and builds successfully
- [ ] `docker build -t theblacklist .` runs without errors
- [ ] `docker run -p 3000:3000 theblacklist` works locally
- [ ] GitHub Actions configured for automated tests (optional)
- [ ] Lint check passes: `npm run lint`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`

## 🧪 Testing & Validation

- [ ] All core user flows tested:
  - [ ] Homepage loads
  - [ ] User registration works
  - [ ] User sign-in works
  - [ ] Forum post creation works
  - [ ] Strain review submission works
  - [ ] Product filtering works
  - [ ] Search functionality works
  - [ ] Admin access controlled properly

- [ ] Performance tested:
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1
  - [ ] Bundle size optimized

- [ ] Security tested:
  - [ ] No CORS bypasses
  - [ ] No XSS vulnerabilities
  - [ ] No SQL injection possibilities
  - [ ] Authorization checks work correctly
  - [ ] Rate limiting blocks abuse

## ⚙️ Production Configuration

- [ ] `.env.local` has all required variables filled in
- [ ] `.env.example` is updated with all new variables
- [ ] `next.config.js` has security headers configured:
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-Frame-Options: DENY (unless needed)
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Referrer-Policy: strict-origin-when-cross-origin

- [ ] `vercel.json` configured for best practices
- [ ] `robotsMetadata` configured for search engines
- [ ] Sitemap generated and submitted to Google Search Console
- [ ] HSTS header configured (if applicable)

## 📞 Support & Documentation

- [ ] README.md updated with deployment instructions
- [ ] DEPLOYMENT.md guide completed with all steps
- [ ] AGENTS.md governance document reviewed
- [ ] CONTRIBUTION.md created for developer guidelines
- [ ] Support contact info added to footer
- [ ] Bug report template created (GitHub Issues)
- [ ] Incident response plan documented

## ✨ Final Verification

- [ ] Test site from multiple geographic locations
- [ ] Test on multiple browsers: Chrome, Firefox, Safari, Edge
- [ ] Test on mobile: iPhone, Android
- [ ] Test on slow networks (throttle to 3G in DevTools)
- [ ] Verify all external links work (404 check)
- [ ] Check for broken images or missing assets
- [ ] Verify tracking pixels fire if analytics enabled
- [ ] DNS propagation check global: https://whatsmydns.net/

## 🎉 Production Go-Live Checklist

Once above verified:

- [ ] Create backup of database before first deploy
- [ ] Have rollback plan ready (see DEPLOYMENT.md)
- [ ] Team available for monitoring first 24 hours
- [ ] Post-launch communication plan ready
- [ ] Status page created (optional but recommended)
- [ ] Customer support team briefed on platform
- [ ] Documentation pushed to internal wiki

---

## Sign-Off

- **Checked By:** ________________ **Date:** __________
- **Approved By:** ________________ **Date:** __________

**Notes:**

```


```

---

If any item is NOT complete, do not proceed to production. Address blocking issues first.

For help, refer to:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Step-by-step deployment guide
- [AGENTS.md](./AGENTS.md) - Architecture and standards
- Vercel Docs: https://vercel.com/docs
- Clerk Docs: https://clerk.com/docs
- Next.js Docs: https://nextjs.org/docs
