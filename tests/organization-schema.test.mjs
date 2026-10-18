import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

// Execute the actual migration in an isolated PostgreSQL runtime, with only
// the existing Supabase identity/business dependencies stubbed out.
test('organization RLS and verification guards', async () => {
  const db = new PGlite()
  const owner = '00000000-0000-0000-0000-000000000001'
  const stranger = '00000000-0000-0000-0000-000000000002'
  const admin = '00000000-0000-0000-0000-000000000003'
  const org = '10000000-0000-0000-0000-000000000001'
  const request = '20000000-0000-0000-0000-000000000001'
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
      create function public.is_reviewer() returns boolean language sql stable as
        $$ select coalesce(current_setting('test.reviewer', true), 'false') = 'true' $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
      create table public.business_profiles (id uuid primary key, owner_id uuid references auth.users(id));
      insert into auth.users values ('${owner}'), ('${stranger}'), ('${admin}');
      insert into public.business_profiles values ('${org}', '${owner}');
    `)
    await db.exec(await readFile(new URL('../supabase/migrations/20261001000000_organization_memberships_and_verification.sql', import.meta.url), 'utf8'))
    const asUser = async (id, reviewer = false) => {
      await db.exec(`reset role; set test.uid = '${id}'; set test.reviewer = '${reviewer}'; set role authenticated;`)
    }
    await asUser(owner)
    assert.equal((await db.query('select * from organization_memberships')).rows.length, 1)
    await db.exec(`insert into organization_memberships (organization_id, user_id, role) values ('${org}', '${admin}', 'admin')`)
    await db.exec(`insert into organization_verification_requests (id, organization_id, submitted_by, legal_name) values ('${request}', '${org}', '${owner}', 'Example')`)
    await assert.rejects(db.exec(`insert into organization_verification_requests (organization_id, submitted_by, legal_name, status) values ('${org}', '${owner}', 'Example', 'approved')`))
    await assert.rejects(db.exec(`update organization_verification_requests set status = 'approved' where id = '${request}'`))
    await assert.rejects(db.exec(`update organization_verification_requests set status = 'withdrawn', reviewed_by = '${owner}' where id = '${request}'`))
    await asUser(stranger)
    assert.equal((await db.query('select * from organization_memberships')).rows.length, 0)
    assert.equal((await db.query('select * from organization_verification_requests')).rows.length, 0)
    await assert.rejects(db.exec(`insert into organization_memberships (organization_id, user_id, role) values ('${org}', '${stranger}', 'admin')`))
    await asUser(admin)
    await assert.rejects(db.exec(`update organization_memberships set user_id = '${stranger}' where user_id = '${admin}'`))
    await db.exec(`delete from organization_memberships where user_id = '${owner}'`)
    assert.equal((await db.query(`select * from organization_memberships where user_id = '${owner}'`)).rows.length, 1)
    await asUser(owner)
    await db.exec(`update organization_verification_requests set status = 'withdrawn' where id = '${request}'`)
    await asUser(admin, true)
    await db.exec(`update organization_verification_requests set status = 'approved' where id = '${request}'`)
    const result = (await db.query(`select * from organization_verification_requests where id = '${request}'`)).rows[0]
    assert.equal(result.reviewed_by, admin)
    assert.ok(result.reviewed_at)
    await db.exec('reset role;')
    // New businesses seed owner access; cascading deletes are not blocked by
    // owner-protection triggers.
    await db.exec(`insert into business_profiles values ('10000000-0000-0000-0000-000000000002', '${owner}')`)
    assert.equal((await db.query('select * from organization_memberships')).rows.length, 3)
    await db.exec(`delete from business_profiles where id = '${org}'`)
    assert.equal((await db.query('select * from organization_memberships')).rows.length, 1)
  } finally {
    await db.close()
  }
})
