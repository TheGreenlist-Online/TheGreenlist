# Production Readiness Checklist

Before deploying The Green List to production, verify all items below are complete.

## Security & Secrets

- [ ] All API keys are in local or platform environment variables, never committed to Git
- [ ] `.gitignore` protects `.env.local`, `.next`, and build artifacts
- [ ] Auth provider keys are valid and tested
- [ ] Porkbun API credentials have appropriate permissions
- [ ] Database connection string uses SSL/TLS where required
- [ ] No hardcoded secrets in source code
- [ ] CORS and origin allowlists use `thegreenlist.online` and approved secondary/local origins only
- [ ] Rate limiting enabled on public API endpoints
- [ ] Content Security Policy headers configured

## Domain & DNS

- [ ] `thegreenlist.online` registered at Porkbun
- [ ] `greenlist.online` registered at Porkbun
- [ ] `thegreenlist.online` added as primary domain in Vercel
- [ ] `greenlist.online` added as secondary/backup domain in Vercel
- [ ] DNS records configured and propagating
- [ ] SSL/TLS certificates auto-provisioned by Vercel
- [ ] Email DNS records configured if email is enabled

## Database

- [ ] Supabase/PostgreSQL database created
- [ ] `DATABASE_URL` configured in Vercel
- [ ] Database connection tested from production environment
- [ ] Prisma schema validated with `npx prisma validate`
- [ ] Prisma client generated with `npx prisma generate`
- [ ] Migrations applied with `npx prisma migrate deploy`
- [ ] Backups enabled and tested

## Authentication

- [ ] `NEXTAUTH_URL=https://thegreenlist.online` if NextAuth is used
- [ ] `NEXTAUTH_SECRET` configured in production
- [ ] Provider redirect URLs include the new domains
- [ ] Supabase redirect allowlist includes the new domains if Supabase Auth is used
- [ ] Sign-in/sign-up flows tested end-to-end
- [ ] User profile/session behavior tested

## Deployment

- [ ] GitHub repository pushed to main branch
- [ ] Vercel project connected to GitHub
- [ ] Build command set to `npm run build`
- [ ] Install command set to `npm install` or matching lockfile policy
- [ ] Environment variables configured in Vercel
- [ ] First production build successful
- [ ] Site loads at `https://thegreenlist.online`
- [ ] Secondary domain resolves at `https://greenlist.online`

## UI/UX & Content

- [ ] Homepage renders The Green List branding
- [ ] Header and mobile navigation show The Green List
- [ ] Metadata, OpenGraph, and Twitter previews use The Green List
- [ ] Forums, businesses, news, reports, report, contact, and legal routes load
- [ ] Responsive design works on mobile and desktop
- [ ] No console errors or warnings in browser DevTools
- [ ] Accessibility basics checked: keyboard navigation, labels, focus states

## Legal & Compliance

- [ ] Privacy Policy page created and linked in footer
- [ ] Terms of Service page created and linked in footer
- [ ] Cannabis compliance disclaimer visible on key pages
- [ ] No direct commerce, sales, ordering, delivery, checkout, payments, inventory, or dispensary transaction features implemented
- [ ] Sponsored content and affiliate links clearly labeled
- [ ] FTC disclosures in place for affiliate content
- [ ] Anti-defamation safeguards for user reports implemented
- [ ] Moderation guidelines documented and accessible

## Monitoring & Logging

- [ ] Error logging configured
- [ ] Analytics enabled
- [ ] Health check endpoint working: `GET /api/health`
- [ ] Database query performance monitored
- [ ] Uptime monitoring configured
- [ ] Alert notifications set up for critical errors
- [ ] Sensitive data is not logged

## Testing & Validation

- [ ] Homepage loads
- [ ] User registration works
- [ ] User sign-in works
- [ ] Forum pages load
- [ ] Report pages load
- [ ] News pages load
- [ ] Admin access controlled properly
- [ ] Lint passes: `npm run lint`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] Prisma validation passes: `npx prisma validate`

## Final Verification

- [ ] Test site from multiple browsers
- [ ] Test on mobile and desktop
- [ ] Verify all external links work
- [ ] Check for broken images or missing assets
- [ ] Confirm DNS propagation globally
- [ ] Confirm production pages do not show legacy branding

## Sign-Off

- **Checked By:** ________________ **Date:** __________
- **Approved By:** ________________ **Date:** __________

If any item is not complete, do not proceed to production. Address blocking issues first.
