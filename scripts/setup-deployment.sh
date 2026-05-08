#!/bin/bash

# THEBLACKLIST.ONLINE - Deployment Configuration Script
# This script helps configure the environment for theblacklist.online domain

set -e

echo "=================================================="
echo "THEBLACKLIST.ONLINE - Deployment Configuration"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
  echo "✓ .env.local already exists"
else
  echo "✗ .env.local not found, creating..."
  cp .env.example .env.local
  echo "✓ Created .env.local - please fill in your credentials"
fi

# Verify Node version
NODE_VERSION=$(node --version)
echo "✓ Node version: $NODE_VERSION"

# Check npm packages
echo ""
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Prisma setup
echo ""
echo "Setting up Prisma..."
npx prisma generate
echo "✓ Prisma client generated"

echo ""
echo "=================================================="
echo "Configuration Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Update .env.local with your credentials:"
echo "   - NEXT_PUBLIC_SITE_URL=https://theblacklist.online"
echo "   - DATABASE_URL (from provider)"
echo "   - CLERK_SECRET_KEY (from Clerk dashboard)"
echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo ""
echo "2. Set up database:"
echo "   npx prisma db push"
echo ""
echo "3. Test locally:"
echo "   npm run dev"
echo ""
echo "4. Deploy to Vercel:"
echo "   vercel deploy --prod"
echo ""
echo "5. Configure domain in Vercel:"
echo "   - Go to Vercel dashboard"
echo "   - Settings > Domains"
echo "   - Add theblacklist.online"
echo "   - Point NS records from registrar"
echo ""