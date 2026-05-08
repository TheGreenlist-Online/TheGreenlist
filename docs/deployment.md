# Deployment Guide

This guide covers deploying THEBLACKLIST.ONLINE to production.

## Vercel Deployment (Recommended)

### Prerequisites
- Vercel account
- Domain purchased from Porkbun
- Supabase project set up

### Steps

1. **Connect Repository**
   - Import your GitHub repository to Vercel
   - Configure project settings

2. **Environment Variables**
   - Add all variables from `.env.example`
   - Use Vercel secrets for sensitive data

3. **Database**
   - Use Supabase or Vercel Postgres
   - Run Prisma migrations: `npx prisma db push`

4. **Domain Configuration**
   - Add custom domain in Vercel dashboard
   - Configure DNS records (see dns-setup.md)

5. **SSL & Security**
   - Vercel provides automatic SSL
   - Configure security headers if needed

## Docker Deployment

### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/That1andOnly/TheBlacklist.git
cd TheBlacklist

# Copy environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local

# Start services
docker-compose -f docker/docker-compose.yml up -d
```

### Manual Docker Build

```bash
# Build image
docker build -t theblacklist .

# Run container
docker run -p 3000:3000 --env-file .env.local theblacklist
```

## Cloudflare Configuration

### DNS Setup
- Point domain to Vercel nameservers
- Configure Cloudflare for additional protection

### Security
- Enable DDoS protection
- Set up WAF rules
- Configure rate limiting

## Environment Variables Checklist

### Required
- [ ] `DATABASE_URL`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Optional
- [ ] `OPENAI_API_KEY`
- [ ] `RESEND_API_KEY` or `SENDGRID_API_KEY`
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `REDIS_URL`

## Post-Deployment Tasks

1. **Database Migration**
   ```bash
   npx prisma db push
   ```

2. **Seed Data** (optional)
   ```bash
   npx prisma db seed
   ```

3. **Test Functionality**
   - User registration/login
   - Forum creation/posting
   - File uploads

4. **Monitoring Setup**
   - Configure Vercel Analytics
   - Set up error tracking (Sentry)
   - Monitor database performance

5. **Backup Configuration**
   - Set up automated database backups
   - Configure backup retention

## Scaling Considerations

- **Database**: Monitor query performance, consider read replicas
- **Storage**: Use Supabase Storage for file uploads
- **Caching**: Implement Redis for session and data caching
- **CDN**: Use Cloudflare for global content delivery

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Database Connection**
   - Verify DATABASE_URL format
   - Check firewall settings
   - Ensure database is accessible

3. **Authentication Issues**
   - Verify OAuth provider configuration
   - Check NEXTAUTH_URL matches domain
   - Ensure secrets are properly set

4. **File Upload Issues**
   - Check Supabase Storage configuration
   - Verify bucket permissions
   - Check file size limits