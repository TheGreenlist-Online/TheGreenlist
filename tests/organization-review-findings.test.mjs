import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const owner = '00000000-0000-0000-0000-000000000001'
const reviewer = '00000000-0000-0000-0000-000000000002'
const org = '10000000-0000-0000-0000-000000000001'
const request = '20000000-0000-0000-0000-000000000001'
const migrations = new URL('../supabase/migrations/', import.meta.url)

async function fixture() {
  const db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create table audit_logs(actor_id uuid, action text, entity_type text, entity_id uuid, metadata jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create function public.has_permission(permission text) returns boolean language sql stable as
      $$ select auth.uid() = '${reviewer}'::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    create table business_profiles(id uuid primary key, owner_id uuid references auth.users(id));
    insert into auth.users values ('${owner}'), ('${reviewer}');
    insert into business_profiles values ('${org}', '${owner}');
  `)
  // The real quota migration also attaches to these pre-existing tables.
  for (const table of ['reports', 'forum_threads', 'forum_posts', 'business_documents', 'education_resources', 'support_tickets']) {
    await db.exec(`create table ${table}(id uuid primary key)`)
  }
  await db.exec(await readFile(new URL('20261001000000_organization_memberships_and_verification.sql', migrations), 'utf8'))
  await db.exec(await readFile(new URL('20261006234128_enforce_client_write_quotas.sql', migrations), 'utf8'))
  await db.exec(await readFile(new URL('20261109101212_organization_review_submission_quota.sql', migrations), 'utf8'))
  const asUser = async id => db.exec(`reset role; set test.uid = '${id}'; set role authenticated;`)
  await asUser(owner)
  await db.exec(`insert into organization_verification_requests(id, organization_id, submitted_by, legal_name)
    values ('${request}', '${org}', '${owner}', 'Example')`)
  return { db, asUser }
}

test('verification submissions enforce a per-actor database quota', async () => {
  const { db } = await fixture()
  try {
    for (let i = 1; i < 10; i++) {
      await db.exec(`insert into organization_verification_requests(organization_id, submitted_by, legal_name)
        values ('${org}', '${owner}', 'Example')`)
    }
    await assert.rejects(db.exec(`insert into organization_verification_requests(organization_id, submitted_by, legal_name)
      values ('${org}', '${owner}', 'Example')`), error => error.code === 'PT429')
    // A failed over-quota write does not persist another row or increment.
    assert.equal((await db.query('select * from organization_verification_requests')).rows.length, 10)
    await assert.rejects(db.exec('delete from private.client_write_buckets'))
    await db.exec('reset role;')
    assert.equal((await db.query("select used from private.client_write_buckets where action = 'organization_verification_requests:INSERT'")).rows[0].used, 10)
    // Changing organizations does not get the same actor a fresh quota.
    const secondOrg = '10000000-0000-0000-0000-000000000002'
    await db.exec(`insert into business_profiles values ('${secondOrg}', '${owner}'); set role authenticated;`)
    await assert.rejects(db.exec(`insert into organization_verification_requests(organization_id, submitted_by, legal_name)
      values ('${secondOrg}', '${owner}', 'Example')`), error => error.code === 'PT429')
    await db.exec(`reset role; update private.client_write_buckets set window_start = window_start - interval '1 hour'; set role authenticated;`)
    await db.exec(`insert into organization_verification_requests(organization_id, submitted_by, legal_name)
      values ('${org}', '${owner}', 'Example')`)
  } finally { await db.close() }
})

test('reviewer Auth deletion only clears attribution and does not log another decision', async () => {
  const { db, asUser } = await fixture()
  try {
    await asUser(reviewer)
    await db.exec(`update organization_verification_requests set status = 'approved' where id = '${request}'`)
    const before = (await db.query(`select * from organization_verification_requests where id = '${request}'`)).rows[0]
    await assert.rejects(db.exec(`update organization_verification_requests set reviewed_by = null where id = '${request}'`))
    await db.exec(`reset role; set test.uid = ''; delete from auth.users where id = '${reviewer}';`)
    const after = (await db.query(`select * from organization_verification_requests where id = '${request}'`)).rows[0]
    assert.deepEqual(after, { ...before, reviewed_by: null })
    assert.equal((await db.query('select * from audit_logs')).rows.length, 1)
  } finally { await db.close() }
})

test('an unsolicited invitation cannot disqualify the assigned reviewer', async () => {
  const { db, asUser } = await fixture()
  try {
    await asUser(reviewer)
    await db.exec(`update organization_verification_requests set status = 'in_review' where id = '${request}'`)
    await asUser(owner)
    await db.exec(`insert into organization_memberships(organization_id, user_id, role, status)
      values ('${org}', '${reviewer}', 'viewer', 'invited')`)
    await asUser(reviewer)
    await db.exec(`update organization_verification_requests set status = 'approved' where id = '${request}'`)
    assert.equal((await db.query(`select status from organization_verification_requests where id = '${request}'`)).rows[0].status, 'approved')
  } finally { await db.close() }
})

test('managers cannot manufacture acceptance; confirmed affiliation still blocks review', async () => {
  const { db, asUser } = await fixture()
  try {
    await assert.rejects(db.exec(`insert into organization_memberships(organization_id, user_id, role, status)
      values ('${org}', '${reviewer}', 'viewer', 'active')`), /accept their own invitation/)
    await assert.rejects(db.exec(`insert into organization_memberships(organization_id, user_id, role, accepted_at)
      values ('${org}', '${reviewer}', 'viewer', now())`), /accept their own invitation/)
    await db.exec(`insert into organization_memberships(organization_id, user_id, role)
      values ('${org}', '${reviewer}', 'viewer')`)
    const invitation = (await db.query(`select * from organization_memberships where user_id = '${reviewer}'`)).rows[0]
    assert.equal(invitation.status, 'invited')
    assert.equal(invitation.accepted_at, null)
    await assert.rejects(db.exec(`update organization_memberships set status = 'active' where user_id = '${reviewer}'`), /invited person/)
    await assert.rejects(db.exec(`update organization_memberships set accepted_at = now() where user_id = '${reviewer}'`), /invited person/)
    await asUser(reviewer)
    await assert.rejects(db.exec(`update organization_memberships set status = 'active', role = 'admin' where user_id = '${reviewer}'`), /cannot change membership details/)
    await assert.rejects(db.exec(`update organization_memberships set status = 'active', accepted_at = now() where user_id = '${reviewer}'`), /cannot change membership details/)
    await db.exec(`update organization_memberships set status = 'active' where user_id = '${reviewer}'`)
    const member = (await db.query(`select * from organization_memberships where user_id = '${reviewer}'`)).rows[0]
    assert.equal(member.role, 'viewer')
    assert.equal(member.status, 'active')
    assert.ok(member.accepted_at)
    await assert.rejects(db.exec(`update organization_verification_requests set status = 'approved' where id = '${request}'`), /affiliated organizations/)
    await asUser(owner)
    await assert.rejects(db.exec(`update organization_memberships set accepted_at = null where user_id = '${reviewer}'`), /invited person/)
    await db.exec(`update organization_memberships set status = 'suspended' where user_id = '${reviewer}'`)
    await asUser(reviewer)
    await assert.rejects(db.exec(`update organization_verification_requests set status = 'approved' where id = '${request}'`), /affiliated organizations/)
  } finally { await db.close() }
})

test('reviewer deletion also preserves an open request with a different authenticated actor', async () => {
  const { db, asUser } = await fixture()
  try {
    await asUser(reviewer)
    await db.exec(`update organization_verification_requests set status = 'in_review', review_note = 'Checking source' where id = '${request}'`)
    const before = (await db.query(`select * from organization_verification_requests where id = '${request}'`)).rows[0]
    await db.exec(`reset role; set test.uid = '${owner}'; delete from auth.users where id = '${reviewer}';`)
    assert.deepEqual((await db.query(`select * from organization_verification_requests where id = '${request}'`)).rows[0], { ...before, reviewed_by: null })
    assert.equal((await db.query('select * from audit_logs')).rows.length, 1)
  } finally { await db.close() }
})
