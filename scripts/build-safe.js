#!/usr/bin/env node

/**
 * Safe build script that generates Prisma Client before building Next.js.
 * 
 * Supabase Auth is the primary auth system and does not require DATABASE_URL.
 * Generating Prisma Client does not connect to the database, so it must run
 * even when DATABASE_URL is intentionally omitted for Supabase-only builds.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isPrismaConfigured = fs.existsSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'));

console.log('[Build] Green List - Supabase Auth + Optional Prisma');

// Vercel caches dependencies, so always regenerate the client when a schema exists.
if (isPrismaConfigured) {
  try {
    console.log('[Build] Generating Prisma client...');
    execSync('prisma generate', { stdio: 'inherit' });
  } catch (error) {
    console.error('[Build] Prisma generation failed.');
    process.exit(1);
  }
} else {
  console.log('[Build] No Prisma schema found; continuing with Supabase Auth only.');
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
