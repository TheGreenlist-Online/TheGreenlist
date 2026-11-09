import assert from 'node:assert/strict'
import test from 'node:test'
import {execFileSync} from 'node:child_process'
import {readFile,mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fresh,fingerprint} from './staging-baseline-helpers.mjs'

async function hostedLikeFixture() {
 const db=await fresh()
 // Match the public namespace ACL observed on the isolated hosted project.
 // This is disposable fixture setup, never a change to the generated payload.
 await db.exec(`revoke all on schema public from public,anon,authenticated,service_role;
  grant usage on schema public to public,postgres,anon,authenticated,service_role;`)
 return db
}

async function compile(script) {
 const dir=await mkdtemp(join(tmpdir(),'greenlist-completion-'))
 try {
  const path=join(dir,'candidate.sql')
  execFileSync('python3',[script,'--target','otmaxtjstvbfckpgbwdi','--output',path])
  // Only local PGlite's fixed database name differs from hosted PostgreSQL.
  return (await readFile(path,'utf8')).replaceAll("current_database() <> 'postgres'","current_database() <> 'template1'").replaceAll("current_database()<>'postgres'","current_database()<>'template1'")
 } finally {await rm(dir,{recursive:true,force:true})}
}

test('completion upgrades exact closed foundation atomically without replacing tables or defaults',async()=>{
 const db=await hostedLikeFixture()
 try {
  const closed=await compile('scripts/build-closed-staging-bootstrap.py')
  const completion=await compile('scripts/build-staging-completion.py')
  await db.exec(closed)
  const tableIds=(await db.query("select c.oid,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('r','p') order by c.oid")).rows
  const before=await fingerprint(db)
  const beforeDefaults=(await db.query('select * from pg_default_acl order by oid')).rows
  await db.exec('begin')
  await db.exec(completion)
  await db.exec('rollback')
  assert.deepEqual(await fingerprint(db),before)
  await db.exec(completion)
  const after=await fingerprint(db)
  for(const category of ['06','07','role-reference','permission-reference']) assert.deepEqual(after[category],before[category])
  assert.equal(after['09'].count,36)
  assert.equal(after['10'].count,22)
  assert.equal(after['11'].count,93)
  assert.equal(after['bucket-reference'].count,4)
  assert.equal(after['application-event-trigger'].count,1)
  assert.deepEqual((await db.query('select * from pg_default_acl order by oid')).rows,beforeDefaults)
  assert.deepEqual((await db.query("select c.oid,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('r','p') order by c.oid")).rows,tableIds)
  await assert.rejects(db.exec(completion),/Expected unused staging platform|Expected exact closed staging foundation/)
  assert.deepEqual(await fingerprint(db),after)
 } finally {await db.close()}
})

test('completion rolls back late access regression and rejects modified closed schemas',async()=>{
 const closed=await compile('scripts/build-closed-staging-bootstrap.py')
 const completion=await compile('scripts/build-staging-completion.py')
 for(const mutation of ['late_grant','early_drift']) {
  const db=await hostedLikeFixture()
  try {
   await db.exec(closed)
   if(mutation==='early_drift') await db.exec('alter table public.profiles disable row level security')
   const before=await fingerprint(db)
   const candidate=mutation==='late_grant'
    ? completion.replace('do $$ declare before_state record;',()=> 'grant execute on function public.has_permission(text) to public;\ndo $$ declare before_state record;')
    : completion
   await assert.rejects(db.exec(candidate),/Expected exact closed staging foundation|Completed schema access hardening failed/)
   assert.deepEqual(await fingerprint(db),before)
   assert.equal((await db.query('select count(*)::int n from storage.buckets')).rows[0].n,0)
  } finally {await db.close()}
 }
})
