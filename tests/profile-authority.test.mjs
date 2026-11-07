import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('owner-authorized role changes preserve UUID audit identity and authority guards', async () => {
  const db = new PGlite()
  const owner = '10000000-0000-4000-8000-000000000001'
  const user = '10000000-0000-4000-8000-000000000002'
  try {
    await db.exec(`
      create schema private; create schema auth;
      create table auth.users(id uuid primary key, platform_owner boolean default false);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('test.actor',true),'')::uuid $$;
      create function private.is_platform_owner(actor uuid) returns boolean language sql stable as
        $$ select exists(select 1 from auth.users where id=actor and platform_owner) $$;
      create table profiles(id uuid primary key, role text not null);
      create table audit_logs(actor_id uuid, action text, entity_type text, entity_id uuid, metadata jsonb);
      insert into auth.users values ('${owner}',true),('${user}',false);
      insert into profiles values ('${owner}','ADMIN'),('${user}','USER');
    `)
    await db.exec(await readFile(new URL('../supabase/migrations/20261019040103_fix_profile_role_audit_uuid.sql', import.meta.url), 'utf8'))
    await db.exec(`create trigger protect_profile_authority before update on profiles
      for each row execute function private.protect_profile_authority();
      set test.actor='${owner}'; update profiles set role='MODERATOR' where id='${user}';`)
    const audit = (await db.query('select * from audit_logs')).rows
    assert.equal(audit.length, 1)
    assert.equal(audit[0].actor_id, owner)
    assert.equal(audit[0].entity_id, user)
    assert.deepEqual(audit[0].metadata, { from: 'USER', to: 'MODERATOR', human_review_required: true })
    await assert.rejects(db.exec(`update profiles set role='USER' where id='${owner}'`), /retain the ADMIN role/)
    await db.exec(`set test.actor='${user}'`)
    await assert.rejects(db.exec(`update profiles set role='ADMIN' where id='${user}'`), /Only the platform owner/)
    await assert.rejects(db.exec(`update profiles set id=gen_random_uuid() where id='${user}'`), /identity cannot be changed/)
    assert.equal((await db.query('select count(*) as n from audit_logs')).rows[0].n, 1)
  } finally {
    await db.close()
  }
})
