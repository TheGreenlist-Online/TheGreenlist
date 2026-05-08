# Supabase Setup Guide

## Overview

THEBLACKLIST.ONLINE uses Supabase for:
- PostgreSQL database hosting
- Real-time subscriptions
- File storage for uploads
- Authentication (optional, using NextAuth instead)

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Choose your organization and project name
5. Select a database password
6. Choose a region close to your users

### 2. Get API Keys

After project creation:

1. Go to Settings → API
2. Copy the following values:
   - Project URL
   - Project API Key (anon/public)
   - Project API Key (service_role) - Keep this secret!

### 3. Environment Variables

Add to your `.env.local`:

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Database Setup

#### Option A: Use Prisma with Supabase

1. Get your database connection string from Supabase Dashboard → Settings → Database
2. Update `DATABASE_URL` in your environment variables
3. Run Prisma migrations:
   ```bash
   npx prisma db push
   ```

#### Option B: Use Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL schema from `prisma/schema.prisma`
3. Note: You'll need to convert Prisma schema to raw SQL

### 5. Storage Setup (Optional)

For file uploads (evidence, images):

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `uploads`
3. Set up RLS (Row Level Security) policies
4. Configure CORS settings

### 6. Real-time Setup (Optional)

For live forum updates:

1. Enable real-time for relevant tables
2. Configure subscriptions in your components

## Security Considerations

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Use Row Level Security (RLS) for data access control
- Implement proper authentication checks
- Regularly rotate API keys

## Migration from Local PostgreSQL

If migrating from a local PostgreSQL instance:

1. Export your data:
   ```bash
   pg_dump your-local-db > backup.sql
   ```

2. Import to Supabase:
   - Use Supabase SQL Editor
   - Or use `psql` with Supabase connection string

3. Update your environment variables

## Monitoring

Monitor your Supabase usage:
- Dashboard → Reports → API Usage
- Dashboard → Database → Query Performance
- Set up alerts for usage limits

## Troubleshooting

### Connection Issues
- Verify DATABASE_URL format
- Check firewall settings
- Ensure SSL is enabled

### Migration Issues
- Check Prisma version compatibility
- Verify schema syntax
- Test migrations on a staging environment first

### Performance Issues
- Enable connection pooling
- Use appropriate indexes
- Monitor query performance