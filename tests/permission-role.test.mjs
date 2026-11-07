import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

for (const returnType of ['text', 'public.app_role']) {
  test(`permission lookup supports ${returnType} role helpers without widening authority`, async () => {
    const db = new PGlite()
    try {
      await db.exec(`
        create type public.app_role as enum ('USER','MODERATOR','ADMIN');
        create table public.role_permissions(role public.app_role, permission text);
        insert into role_permissions values ('ADMIN','business.review'),('MODERATOR','moderation.review');
        create function public.is_platform_owner() returns boolean language sql stable as
          $$ select coalesce(current_setting('test.owner',true),'false')='true' $$;
        create function public.current_platform_role() returns ${returnType} language sql stable as
          $$ select nullif(current_setting('test.role',true),'')::${returnType} $$;
      `)
      await db.exec(await readFile(new URL('../supabase/migrations/20261019040245_align_permission_role_comparison.sql', import.meta.url), 'utf8'))
      const allowed = async permission => (await db.query('select has_permission($1) as allowed', [permission])).rows[0].allowed
      await db.exec(`set test.role='ADMIN'`)
      assert.equal(await allowed('business.review'), true)
      assert.equal(await allowed('unassigned.permission'), false)
      await db.exec(`set test.role='MODERATOR'`)
      assert.equal(await allowed('business.review'), false)
      assert.equal(await allowed('moderation.review'), true)
      await db.exec(`set test.role='USER'`)
      assert.equal(await allowed('business.review'), false)
      await db.exec(`set test.role=''`)
      assert.equal(await allowed('business.review'), false)
      await db.exec(`set test.owner='true'`)
      assert.equal(await allowed('business.review'), true)
    } finally {
      await db.close()
    }
  })
}
