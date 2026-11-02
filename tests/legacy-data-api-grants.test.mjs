import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('legacy grant cleanup is repeat-safe and preserves privileged and unrelated access', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create table public.audit_logs (id integer);
      create table public.automation_jobs (id integer);
      create table public.business_documents (id integer);
      create table public.unrelated_records (id integer);
      grant all privileges on all tables in schema public to anon, authenticated, service_role;
    `)
    const privileges = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']
    const roles = ['anon', 'authenticated', 'service_role', 'postgres']
    const tables = ['audit_logs', 'automation_jobs', 'business_documents', 'unrelated_records']
    const hasPrivilege = async (role, table, privilege) => (
      await db.query('select has_table_privilege($1, $2, $3) as allowed', [role, `public.${table}`, privilege])
    ).rows[0].allowed

    for (const table of tables) {
      for (const role of roles) {
        for (const privilege of privileges) {
          assert.equal(await hasPrivilege(role, table, privilege), true, `${table}: ${role} initially has ${privilege}`)
        }
      }
    }

    const migration = await readFile(new URL('../supabase/migrations/20261024060000_revoke_legacy_data_api_grants.sql', import.meta.url), 'utf8')
    for (let run = 0; run < 2; run++) {
      await db.exec(migration)
      for (const table of tables) {
        for (const role of roles) {
          for (const privilege of privileges) {
            const expected = table === 'unrelated_records' || role === 'service_role' || role === 'postgres'
            assert.equal(await hasPrivilege(role, table, privilege), expected, `run ${run + 1}: ${table}, ${role}, ${privilege}`)
          }
        }
      }
    }
  } finally {
    await db.close()
  }
})
