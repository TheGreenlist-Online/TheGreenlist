#!/usr/bin/env node

/**
 * Safe build script that conditionally runs Prisma generation.
 * 
 * Supabase Auth is the primary auth system and does not require DATABASE_URL.
 * Prisma generation is skipped if DATABASE_URL is not configured.
 * This allows Vercel builds to succeed with Supabase-only configuration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const hasDatabase = !!process.env.DATABASE_URL;
const isPrismaConfigured = fs.existsSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'));

console.log('[Build] Green List - Supabase Auth + Optional Prisma');

// Only run prisma generate if DATABASE_URL is set and schema exists
if (hasDatabase && isPrismaConfigured) {
  try {
    console.log('[Build] Generating Prisma client...');
    execSync('prisma generate', { stdio: 'inherit' });
  } catch (error) {
    console.warn('[Build] Prisma generation failed. Continuing without database models.');
    console.warn('  This is OK for Supabase Auth-only deployments.');
  }
} else {
  console.log('[Build] Skipping Prisma generation (DATABASE_URL not set)');
  console.log('[Build] Supabase Auth will be used instead');
}

// Run Next.js build
console.log('[Build] Building Next.js application...');
try {
  execSync('next build', { stdio: 'inherit' });
  console.log('[Build] ✓ Build complete');
  process.exit(0);
} catch (error) {
  console.error('[Build] ✗ Build failed');
  process.exit(1);
}
