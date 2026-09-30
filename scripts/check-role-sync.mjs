#!/usr/bin/env node
/**
 * Fails if the role system in src/lib/roles.ts has drifted from the database.
 *
 * This project previously had three disagreeing role systems: profiles.role,
 * a user_roles table that no application code maintained, and a
 * role_permissions table using a different permission vocabulary than the app.
 * They diverged because nothing compared them. This script is that comparison.
 *
 *   npm run check:roles
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (role_permissions
 * is readable only by review authority, so the anon key is not enough). Without
 * them it exits 0 with a notice, so a build without database secrets is not
 * blocked — wire it into CI where the secrets exist.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

// Read the TypeScript mirror by evaluating just its data structures. Importing
// the .ts file directly would need a loader, so the arrays are parsed out of
// the source instead. Kept deliberately narrow: it only understands the shape
// roles.ts actually uses.
function loadExpected() {
  const src = readFileSync(resolve(root, 'src/lib/roles.ts'), 'utf8')

  const roles = [...src.matchAll(/^\s*'([A-Z]+)',$/gm)]
    .map((m) => m[1])
    .filter((r, i, a) => a.indexOf(r) === i)

  const catalog = {}
  const catalogBlock = src.slice(src.indexOf('export const ROLE_CATALOG'))
  for (const m of catalogBlock.matchAll(
    /(\w+):\s*\{\s*category:\s*'(COMMUNITY|OPERATOR|REVIEW)',\s*label:\s*'([^']*)',[\s\S]*?sortOrder:\s*(\d+),/g,
  )) {
    catalog[m[1]] = { category: m[2], label: m[3], sortOrder: Number(m[4]) }
  }

  return { roles, catalog }
}

/**
 * Resolves ROLE_PERMISSIONS from roles.ts by stripping its type annotations and
 * evaluating the declarations. This deliberately avoids restating the grants
 * here: the composed arrays (baselines plus per-role additions) are what the
 * application actually enforces, so they are what gets compared.
 */
function loadExpectedPermissions() {
  const src = readFileSync(resolve(root, 'src/lib/roles.ts'), 'utf8')
  const start = src.indexOf('const COMMUNITY_BASELINE')
  const marker = 'export const ROLE_PERMISSIONS'
  const permStart = src.indexOf(marker)
  if (start === -1 || permStart === -1) {
    throw new Error('could not locate the permission declarations in src/lib/roles.ts')
  }

  // End of the ROLE_PERMISSIONS object literal: first line that is exactly '}'.
  const after = src.slice(permStart)
  const endRel = after.search(/\n\}\n/)
  if (endRel === -1) throw new Error('could not find the end of ROLE_PERMISSIONS')

  let code = src.slice(start, permStart + endRel + 3)
  code = code
    .replace(/export /g, '')
    .replace(/:\s*readonly PlatformPermission\[\]/g, '')
    .replace(/:\s*Readonly<Record<PlatformRole,\s*readonly PlatformPermission\[\]>>/g, '')

  return new Function(`${code}\nreturn ROLE_PERMISSIONS;`)()
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.log(
      'check:roles — skipped, NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set.',
    )
    return 0
  }

  const db = createClient(url, key, { auth: { persistSession: false } })
  const { catalog } = loadExpected()

  const problems = []

  // --- role_catalog ---------------------------------------------------------
  const { data: dbCatalog, error: catalogError } = await db
    .from('role_catalog')
    .select('role, category, label, sort_order')

  if (catalogError) {
    problems.push(`could not read role_catalog: ${catalogError.message}`)
  } else {
    const dbByRole = new Map(dbCatalog.map((r) => [r.role, r]))
    for (const [role, expected] of Object.entries(catalog)) {
      const actual = dbByRole.get(role)
      if (!actual) {
        problems.push(`role ${role} is in roles.ts but not in role_catalog`)
        continue
      }
      if (actual.category !== expected.category) {
        problems.push(
          `role ${role}: category is '${actual.category}' in the database, '${expected.category}' in roles.ts`,
        )
      }
      if (actual.label !== expected.label) {
        problems.push(
          `role ${role}: label is '${actual.label}' in the database, '${expected.label}' in roles.ts`,
        )
      }
      if (actual.sort_order !== expected.sortOrder) {
        problems.push(
          `role ${role}: sort_order is ${actual.sort_order} in the database, ${expected.sortOrder} in roles.ts`,
        )
      }
      dbByRole.delete(role)
    }
    for (const role of dbByRole.keys()) {
      problems.push(`role ${role} is in role_catalog but not in roles.ts`)
    }
  }

  // --- role_permissions ----------------------------------------------------
  // Compared against the app's own resolution of the grants, so the check
  // covers the composed arrays (baselines plus additions) rather than a second
  // hand-written list that could itself be wrong.
  const { data: dbPerms, error: permError } = await db
    .from('role_permissions')
    .select('role, permission')

  if (permError) {
    problems.push(`could not read role_permissions: ${permError.message}`)
  } else {
    const expectedPerms = loadExpectedPermissions()

    const dbSet = new Set(dbPerms.map((r) => `${r.role}:${r.permission}`))
    const tsSet = new Set(
      Object.entries(expectedPerms).flatMap(([role, perms]) =>
        perms.map((p) => `${role}:${p}`),
      ),
    )

    for (const grant of tsSet) {
      if (!dbSet.has(grant)) problems.push(`grant ${grant} in roles.ts is missing from the database`)
    }
    for (const grant of dbSet) {
      if (!tsSet.has(grant)) problems.push(`grant ${grant} in the database is missing from roles.ts`)
    }
  }

  if (problems.length) {
    console.error('check:roles — the app and the database disagree:\n')
    for (const p of problems) console.error(`  - ${p}`)
    console.error(
      '\nUpdate src/lib/roles.ts and add a migration so both sides match, then re-run.',
    )
    return 1
  }

  console.log('check:roles — app and database role systems agree.')
  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('check:roles — failed to run:', err)
    process.exit(1)
  })
