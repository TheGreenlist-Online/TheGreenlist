import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Real PostgreSQL engine with an isolated minimal Supabase auth/Storage schema.
// Does not model the Storage HTTP server; staging must test that separately.
test('COA migration enforces direct database and Storage authorization', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema private; create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
      grant usage on schema public, auth, private, storage to anon, authenticated, service_role;
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
      alter table storage.buckets enable row level security;
      alter table storage.objects enable row level security;
      grant all on storage.buckets, storage.objects to anon, authenticated, service_role;
      create policy preexisting_broad_objects on storage.objects for all to anon, authenticated using(true) with check(true);
      create policy preexisting_broad_buckets on storage.buckets for all to anon, authenticated using(true) with check(true);
      alter default privileges in schema public grant all on tables to anon, authenticated;
      insert into auth.users values ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');
    `)
    await db.exec(await readFile(new URL('../supabase/migrations/20261017202824_private_coa_intake.sql', import.meta.url), 'utf8'))
    const owner = '00000000-0000-4000-8000-000000000001'
    const other = '00000000-0000-4000-8000-000000000002'
    const id = '10000000-0000-4000-8000-000000000001'
    const insert = (n, extra = '') => `insert into public.coa_reports(id, owner_id, storage_path, source_sha256, file_size ${extra ? ',publication_status' : ''}) values ('${n}', '${owner}', '${owner}/${n}/original.pdf', '${'a'.repeat(64)}', 40 ${extra ? ",'public'" : ''})`
    async function role(name, user = '', claims = '{}') {
      await db.exec('reset role')
      await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [user, claims])
      await db.exec(`set role ${name}`)
    }
    await role('service_role')
    await db.exec(insert(id))
    await db.exec(`insert into storage.objects(bucket_id,name) values ('coa-sources','${owner}/${id}/original.pdf')`)
    for (const [name, user, expected, claims] of [['anon', '', 0, '{}'], ['authenticated', owner, 1, '{}'], ['authenticated', other, 0, '{"app_metadata":{"role":"ADMIN"}}'], ['authenticated', owner, 0, '{"is_anonymous":true}']]) {
      await role(name, user, claims)
      if (name === 'anon') await assert.rejects(db.query('select * from public.coa_reports'), /permission denied/)
      else assert.equal((await db.query('select * from public.coa_reports')).rows.length, expected)
      await assert.rejects(db.exec(insert('10000000-0000-4000-8000-000000000002')), /permission denied/)
      await assert.rejects(db.exec("update public.coa_reports set authenticity_status='verified'"), /permission denied/)
      await assert.rejects(db.exec('delete from public.coa_reports'), /permission denied/)
      assert.equal((await db.query("select * from storage.objects where bucket_id='coa-sources'")).rows.length, 0)
      await assert.rejects(db.exec("insert into storage.objects(bucket_id,name) values('coa-sources','forged.pdf')"), /row-level security/)
      assert.equal((await db.query("update storage.objects set name='replaced' where bucket_id='coa-sources' returning id")).rows.length, 0)
      assert.equal((await db.query("delete from storage.objects where bucket_id='coa-sources' returning id")).rows.length, 0)
      assert.equal((await db.query("update storage.buckets set public=true where id='coa-sources' returning id")).rows.length, 0)
    }
    await role('service_role')
    await assert.rejects(db.exec(insert('10000000-0000-4000-8000-000000000003', 'publication')), /check constraint/)
    await assert.rejects(db.exec(`update public.coa_reports set storage_path='other.pdf' where id='${id}'`), /immutable/)
    await assert.rejects(db.exec(`update public.coa_reports set intake_status='submitted' where id='${id}'`), /check constraint/)
    await db.exec(`update public.coa_reports set intake_status='submitted',received_at=now() where id='${id}'`)
    await assert.rejects(db.exec(`update public.coa_reports set intake_status='upload_failed',received_at=null where id='${id}'`), /immutable/)
    for (let n = 2; n <= 5; n++) await db.exec(insert(`10000000-0000-4000-8000-00000000000${n}`))
    await assert.rejects(db.exec(insert('10000000-0000-4000-8000-000000000006')), /quota/)
    await assert.rejects(db.exec(insert(id)), /duplicate key/)
    await role('authenticated', owner)
    const rows = (await db.query('select * from public.coa_reports')).rows
    assert.equal(rows.length, 5)
    assert.equal(rows[0].publication_status, 'private')
    assert.equal(rows[0].authenticity_status, 'unverified')
    assert.equal(rows[0].human_review_status, 'not_reviewed')
    assert.equal(rows[0].extraction_status, 'not_started')
  } finally { await db.close() }
})
