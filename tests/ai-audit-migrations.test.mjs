import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Executes the real SQL in disposable PostgreSQL, never a linked Supabase DB.
// Auth and the canonical permission decision are fixture dependencies, not
// substitutes to install in staging. Hosted schema/advisor checks remain required.
const sql = async (name) => readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), 'utf8')
const base = await sql('20261019050000_ai_audit_logs')
const permissions = await sql('20261107010000_ai_audit_permissions')
const columns = await sql('20261107020000_ai_audit_moderation_columns')
const owner = '00000000-0000-4000-8000-000000000001'
const other = '00000000-0000-4000-8000-000000000002'
const reviewer = '00000000-0000-4000-8000-000000000003'

async function fixture(withPermissionHelper = true) {
  const db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create table public.profiles(id uuid primary key, role text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    insert into auth.users values ('${owner}'), ('${other}'), ('${reviewer}');
  `)
  if (withPermissionHelper) await db.exec(`
    create function public.has_permission(p text) returns boolean language sql stable as $$
      select p = 'audit.read' and auth.uid() = '${reviewer}'::uuid $$;
  `)
  return db
}

const insert = (feature = 'records-guide', user = owner, extra = '') => `
  insert into public.ai_audit_logs
    (user_id, feature, model, request_id, input_classification, output_classification, status${extra ? ', moderation_recommendation, moderation_confidence' : ''})
  values ('${user}', '${feature}', 'fixture-model', gen_random_uuid(), 'public_query', 'public_navigation', 'success'${extra ? `, ${extra}` : ''})`

async function role(db, name, user = '', claims = '{}') {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [user, claims])
  await db.exec(`set role ${name}`)
}

async function accessSnapshot(db) {
  const rls = await db.query("select relrowsecurity, relforcerowsecurity, relacl::text from pg_class where oid='public.ai_audit_logs'::regclass")
  const policies = await db.query("select policyname, cmd, qual, with_check from pg_policies where schemaname='public' and tablename='ai_audit_logs' order by policyname")
  return { rls: rls.rows, policies: policies.rows }
}

test('AI audit migrations enforce append-only writes and canonical read policy', async () => {
  const db = await fixture()
  try {
    await db.exec(base)
    // Model existing service-role grants that the permissions migration removes.
    await db.exec('grant update, delete, truncate on public.ai_audit_logs to service_role')
    await db.exec(permissions)
    await db.exec(columns)
    await db.exec(columns) // Safe repeat; no duplicated checks or data changes.
    await role(db, 'service_role')
    await db.exec(insert())
    await db.exec(insert('town-guide', other)) // Historical feature remains valid.
    await db.exec(insert('moderation-review', owner, "'HOLD_FOR_REVIEW', 'high'"))
    await assert.rejects(db.exec(insert('records-guide', owner, "'invented recommendation', 'high'")), /check constraint/)
    await assert.rejects(db.exec(insert('records-guide', owner, "'ALLOW', 'certain'")), /check constraint/)
    await assert.rejects(db.exec(insert('invented-feature')), /check constraint/)
    for (const name of ['anon', 'authenticated', 'service_role']) {
      await role(db, name, owner)
      if (name !== 'service_role') await assert.rejects(db.exec(insert()), /permission denied/)
      for (const statement of ['update public.ai_audit_logs set model = \'changed\'', 'delete from public.ai_audit_logs', 'truncate public.ai_audit_logs']) {
        await assert.rejects(db.exec(statement), /permission denied/)
      }
    }
    await role(db, 'anon')
    await assert.rejects(db.query('select * from public.ai_audit_logs'), /permission denied/)
    for (const [user, expected, claims] of [[owner, 2, '{}'], [other, 1, '{"app_metadata":{"platform_owner":true,"role":"ADMIN"}}'], [reviewer, 3, '{}']]) {
      await role(db, 'authenticated', user, claims)
      assert.equal((await db.query('select * from public.ai_audit_logs')).rows.length, expected)
    }
    await db.exec('reset role')
    const { rows } = await db.query("select cmd from pg_policies where tablename='ai_audit_logs'")
    assert.deepEqual(rows, [{ cmd: 'SELECT' }])
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.ai_audit_logs'::regclass")).rows[0].relrowsecurity, true)
  } finally { await db.close() }
})

test('column repair preserves existing rows and closed access before base migration', async () => {
  const db = await fixture()
  try {
    await db.exec(base)
    await db.exec(insert('town-guide'))
    await db.exec(`
      alter table public.ai_audit_logs drop column moderation_recommendation, drop column moderation_confidence;
      drop policy ai_audit_logs_self_read on public.ai_audit_logs;
      revoke all on public.ai_audit_logs from public, anon, authenticated, service_role;
      alter table public.ai_audit_logs force row level security;
    `)
    // CREATE TABLE IF NOT EXISTS alone cannot upgrade this pre-existing shape.
    await assert.rejects(db.exec(base), /moderation_recommendation.*does not exist/)
    const before = await accessSnapshot(db)
    const rowsBefore = (await db.query('select * from public.ai_audit_logs')).rows
    await db.exec(columns)
    await db.exec(columns)
    assert.deepEqual(await accessSnapshot(db), before)
    const rowsAfter = (await db.query('select * from public.ai_audit_logs')).rows
    assert.deepEqual(rowsAfter, rowsBefore.map((row) => ({ ...row, moderation_recommendation: null, moderation_confidence: null })))
    await assert.rejects(db.exec("update public.ai_audit_logs set moderation_recommendation='unbounded text'"), /check constraint/)
    await assert.rejects(db.exec("update public.ai_audit_logs set moderation_confidence='certain'"), /check constraint/)
    // Once separately reviewed foundation prerequisites exist, actual migration
    // SQL can run. This does not authorize hosted permission changes.
    await db.exec(base)
    await db.exec(permissions)
    await role(db, 'service_role')
    await db.exec(insert('records-guide', owner, "'LABEL_ONLY', 'medium'"))
  } finally { await db.close() }
})

test('permissions migration fails explicitly without canonical permission helper', async () => {
  const db = await fixture(false)
  try {
    await db.exec(base)
    await db.exec(columns)
    await assert.rejects(db.exec(permissions), /has_permission.*does not exist/)
    assert.equal((await db.query("select to_regprocedure('public.has_permission(text)') as helper")).rows[0].helper, null)
  } finally { await db.close() }
})
