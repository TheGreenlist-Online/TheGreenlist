# Supabase Setup Guide

## Overview

The Green List uses Supabase for:
- PostgreSQL database hosting
- Realtime features where needed
- File storage for uploads and evidence
- Auth support where configured alongside or instead of NextAuth

## Setup Steps

### 1. Create Supabase Project

1. Go to Supabase
2. Sign up or log in
3. Create a new project
4. Choose your organization and project name
5. Select a database password
6. Choose a region close to your users

### 2. Get API Keys

After project creation:

1. Go to Settings > API
2. Copy the following values:
   - Project URL
   - Project API key for browser-safe client usage
   - Service role key, which must stay server-side only

### 3. Environment Variables

Add to `.env.local` and Vercel as needed:

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
NEXT_PUBLIC_SITE_URL=https://thegreenlist.online
NEXTAUTH_URL=https://thegreenlist.online
```

### 4. Redirect URL Allowlist

If Supabase Auth or provider callbacks are used, allow:

```text
https://thegreenlist.online
https://greenlist.online
https://thegreenlist.online/auth/callback
https://greenlist.online/auth/callback
http://localhost:3000
http://localhost:3000/auth/callback
```

Only include callback paths that the app actually uses.

### 5. Database Setup

#### Option A: Use Prisma with Supabase

1. Get your database connection string from Supabase Dashboard > Settings > Database
2. Update `DATABASE_URL` in your environment variables
3. Run Prisma validation and migrations:
   ```bash
   npx prisma validate
   npx prisma migrate deploy
   ```

#### Option B: Use Supabase SQL Editor

1. Go to Supabase Dashboard > SQL Editor
2. Apply reviewed SQL migrations if the repo provides them
3. Keep schema changes tracked in the repository

### 6. Storage Setup

For uploads such as evidence and images:

1. Go to Supabase Dashboard > Storage
2. Create the required buckets
3. Enable Row Level Security policies
4. Configure CORS settings only for approved origins

## Security Considerations

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Use Row Level Security for data access control
- Implement authorization checks in server routes
- Keep sensitive reports and evidence private unless explicitly approved for public display
- Regularly rotate API keys

## Monitoring

Monitor Supabase usage through:
- Dashboard > Reports > API Usage
- Dashboard > Database > Query Performance
- Alerts for usage limits and database errors

## Troubleshooting

### Connection Issues
- Verify `DATABASE_URL` format
- Ensure SSL is enabled where required
- Check Supabase project status and connection pool settings

### Migration Issues
- Check Prisma version compatibility
- Run `npx prisma validate`
- Test migrations on a staging environment first

### Performance Issues
- Enable connection pooling
- Use appropriate indexes
- Monitor slow queries
