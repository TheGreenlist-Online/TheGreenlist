import assert from 'node:assert/strict'
import test from 'node:test'
import {execFileSync} from 'node:child_process'
import {readFile, mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fresh, restore, fingerprint, read} from './staging-baseline-helpers.mjs'

async function compiled() {
  const dir=await mkdtemp(join(tmpdir(),'greenlist-closed-'))
  const output=join(dir,'foundation.sql')
  try {
    execFileSync('python3',['scripts/build-closed-staging-bootstrap.py','--target','otmaxtjstvbfckpgbwdi','--output',output])
    return await readFile(output,'utf8')
  } finally {await rm(dir,{recursive:true,force:true})}
}
async function apply(db,sql,{rollback=false}={}) {
  await db.exec('begin')
  try {await db.exec(sql);await db.exec(rollback?'rollback':'commit')}
  catch(error) {await db.exec('rollback');throw error}
}
// PGlite always connects to template1. This test-only adapter changes exactly
// the database-name comparison, never the compiled hosted artifact or target.
const forPGlite=sql=>sql.replace("current_database() <> 'postgres'", "current_database() <> 'template1'")
const tableColumns=`select s.nspname,c.relname,a.attname,a.attnum,
 format_type(a.atttypid,a.atttypmod) as type,a.attnotnull,a.attidentity,a.attgenerated,
 pg_get_expr(d.adbin,d.adrelid) as default_expression
 from pg_class c join pg_namespace s on s.oid=c.relnamespace
 join pg_attribute a on a.attrelid=c.oid
 left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
 where s.nspname in ('public','private') and c.relkind in ('r','p')
 and a.attnum>0 and not a.attisdropped order by 1,2,4`

test('closed foundation preserves table structure but exposes no application access',async()=>{
  const sql=forPGlite(await compiled()), db=await fresh(), reference=await fresh()
  try {
    // Model broad platform defaults inherited by every newly-created table.
    await db.exec('alter default privileges for role postgres in schema public grant all on tables to anon,authenticated,service_role')
    await apply(db,sql,{rollback:true})
    assert.equal((await db.query("select to_regclass('public.profiles') as object")).rows[0].object,null)
    await apply(db,sql)
    await restore(reference)
    assert.deepEqual((await db.query(tableColumns)).rows,(await reference.query(tableColumns)).rows)
    const expected=JSON.parse(await read('catalog-fingerprint.json'))
    const actual=await fingerprint(db)
    assert.deepEqual(actual['06'],expected['06'],'all 127 constraints')
    assert.deepEqual(actual['07'],expected['07'],'all 101 indexes')
    assert.deepEqual(actual['role-reference'],expected['role-reference'])
    assert.deepEqual(actual['permission-reference'],expected['permission-reference'])
    for(const key of ['09','10','11','bucket-reference','application-event-trigger']) assert.equal(actual[key].count,0,key)
    const state=(await db.query(`select count(*)::int as tables,
       count(*) filter (where c.relrowsecurity and c.relforcerowsecurity)::int as forced_rls
       from pg_class c join pg_namespace s on s.oid=c.relnamespace
       where s.nspname in ('public','private') and c.relkind in ('r','p')`)).rows[0]
    assert.deepEqual(state,{tables:30,forced_rls:30})
    for(const role of ['anon','authenticated','service_role']) {
      await db.exec(`set role ${role}`)
      for(const statement of ['select * from public.role_catalog',"insert into public.role_permissions values('USER','platform.admin')",
        'select * from public.profiles','truncate public.news']) await assert.rejects(db.exec(statement),/permission denied/)
      await db.exec('reset role')
    }
    await assert.rejects(apply(db,sql),/untouched empty staging/)
    assert.deepEqual(await fingerprint(db),actual,'replay fails without catalog mutation')
  } finally {await db.close();await reference.close()}
})

test('closed foundation rejects existing identities and rolls back failed lockdown verification',async()=>{
  const sql=forPGlite(await compiled())
  for(const mode of ['identity','injected_grant','missing_lockdown']) {
    const db=await fresh()
    try {
      if(mode==='identity') await db.exec("insert into auth.users(id,email) values('90000000-0000-4000-8000-000000000001','synthetic@example.invalid')")
      let candidate=sql
      if(mode==='injected_grant') candidate=sql.replace('do $$ declare n integer;', ()=>'grant select on public.profiles to anon;\ndo $$ declare n integer;')
      if(mode==='missing_lockdown') candidate=sql.replace("execute format('alter table %I.%I force row level security',obj.nspname,obj.relname);",'null;')
      // The compiler emits one atomic server DO statement: prove a late failure
      // rolls back even without a caller-supplied transaction wrapper.
      await assert.rejects(db.exec(candidate),/untouched empty staging|access boundary failed/)
      assert.equal((await db.query("select to_regclass('public.profiles') as object")).rows[0].object,null)
    } finally {await db.close()}
  }
})

test('closed foundation compiler rejects any non-staging project',()=>{
  assert.throws(()=>execFileSync('python3',['scripts/build-closed-staging-bootstrap.py','--target','idtnlninotxwqpznbwur','--output','/tmp/greenlist-must-not-write.sql'],{stdio:'pipe'}),/Only the isolated staging target/)
})

test('unaltered hosted database-name guard rejects the local template1 fixture',async()=>{
  const db=await fresh()
  try {
    await assert.rejects(db.exec(await compiled()),/Expected staging PostgreSQL 17 postgres connection/)
    assert.equal((await db.query("select to_regclass('public.profiles') as object")).rows[0].object,null)
  } finally {await db.close()}
})
