import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import {fresh,restore} from './staging-baseline-helpers.mjs'

// OFFLINE DISPOSABLE FIXTURES ONLY: this is not a provisioning migration.
// PGlite runs an administrative session and SET ROLE models effective-role ACLs.
// It does not certify a PostgreSQL login, the ability/inability of that login to
// SET/RESET ROLE, hosted default privileges, extensions, or catalog-only usability.
const validator='greenlist_staging_validator'
const hardening=await readFile(new URL('../supabase/bootstrap/staging-completion/90-authority-hardening.sql',import.meta.url),'utf8')
const userId='70000000-0000-4000-8000-000000000001'
const schemas="('public','private','auth','storage')"

async function setup() {
 const db=await fresh()
 try {
  await restore(db)
  await db.exec(hardening)
  // No password, memberships, object grants, or broad catalog-reader grants.
  await db.exec(`create role ${validator} nologin nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls`)
  await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'fixture@example.invalid','{\"platform_owner\":true}')",[userId])
  await db.exec("insert into storage.buckets(id,name,public) values('validator-fixture','validator-fixture',false)")
  await db.query("insert into storage.objects(bucket_id,name,owner) values('validator-fixture','fixture.txt',$1)",[userId])
  return db
 } catch(error) {await db.close();throw error}
}
async function effectiveRole(db) {
 const {rows:[role]}=await db.query(`select current_user as name,session_user as session_name,
  rolsuper,rolcanlogin,rolcreatedb,rolcreaterole,rolinherit,rolreplication,rolbypassrls
  from pg_roles where rolname=current_user`)
 assert.equal(role.name,validator,'must evaluate the intended effective role, not the administrative harness')
 for(const flag of ['rolsuper','rolcanlogin','rolcreatedb','rolcreaterole','rolinherit','rolreplication','rolbypassrls'])
  assert.equal(role[flag],false,flag)
 return role
}
async function denied(db,sql,params=[]) {
 await assert.rejects(db.query(sql,params),error=>{
  assert.equal(error.code,'42501',`${sql}: expected permission denial, not syntax or missing-object failure`)
  return true
 })
}
async function accessibleApplicationRoutines(db) {
 return (await db.query(`select n.nspname,p.proname,p.oid::regprocedure::text as signature
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','private') and has_function_privilege(current_user,p.oid,'EXECUTE')
  order by 1,2,3`)).rows
}
async function assertNoDataAccess(db) {
 const tables=(await db.query(`select n.nspname,c.relname from pg_class c
  join pg_namespace n on n.oid=c.relnamespace where n.nspname in ${schemas}
  and c.relkind in ('r','p','v','m','f')
  and has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')`)).rows
 assert.deepEqual(tables,[],'no table ACLs, even where RLS might hide rows')
 for(const table of ['public.profiles','private.business_user_roles','auth.users','storage.objects','storage.buckets']) {
  await denied(db,`select * from ${table}`)
  await denied(db,`delete from ${table}`)
 }
 await denied(db,"update public.profiles set display_name='forged edit'")
 await denied(db,'insert into public.profiles(id) values($1)',[userId])
 await denied(db,"update auth.users set raw_app_meta_data='{}'")
 await denied(db,'insert into auth.users(id) values($1)',[userId])
 await denied(db,"update storage.objects set name='forged.txt'")
 await denied(db,"insert into storage.objects(bucket_id,name) values('validator-fixture','forged.txt')")
 await denied(db,"update storage.buckets set public=true")
 await denied(db,"insert into storage.buckets(id,name) values('forged','forged')")
}

test('offline validator effective role is unprivileged, owns nothing, and has no memberships',async()=>{
 const db=await setup()
 try {
  await assert.rejects(effectiveRole(db),/intended effective role/)
  const members=(await db.query(`select * from pg_auth_members where member=(select oid from pg_roles where rolname=$1)`,[validator])).rows
  assert.deepEqual(members,[])
  const credentials=(await db.query('select rolpassword from pg_authid where rolname=$1',[validator])).rows
  assert.deepEqual(credentials,[{rolpassword:null}])
  await db.exec(`set role ${validator}`)
  const role=await effectiveRole(db)
  assert.notEqual(role.session_name,validator,'harness is not an authenticated validator login')
  const owners=(await db.query(`select classid,objid from pg_shdepend where refclassid='pg_authid'::regclass
   and refobjid=(select oid from pg_roles where rolname=current_user) and deptype='o'`)).rows
  assert.deepEqual(owners,[])
 } finally {await db.close()}
})

test('offline validator cannot read or mutate application, Auth, or Storage fixtures',async()=>{
 const db=await setup()
 try {
  await db.exec(`set role ${validator}`)
  await effectiveRole(db)
  await assertNoDataAccess(db)
 } finally {await db.close()}
})

test('forged JWT settings and disabling read-only do not confer data or application routine privileges',async()=>{
 const db=await setup()
 try {
  await db.exec(`set role ${validator}`)
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
   [userId,JSON.stringify({sub:userId,role:'service_role',app_metadata:{platform_owner:true,role:'ADMIN'},user_metadata:{platform_owner:true}})])
  await db.exec('set default_transaction_read_only=off; set transaction_read_only=off')
  assert.equal((await db.query('show transaction_read_only')).rows[0].transaction_read_only,'off')
  await effectiveRole(db)
  await assertNoDataAccess(db)
  assert.deepEqual(await accessibleApplicationRoutines(db),[])
  await denied(db,"select public.has_permission('platform.admin')")
  await denied(db,'select public.is_platform_owner()')
  await denied(db,'select private.is_platform_owner($1)',[userId])
 } finally {await db.close()}
})

test('offline validator cannot directly create schema objects or take object ownership',async()=>{
 const db=await setup()
 try {
  await db.exec(`set role ${validator}`)
  await effectiveRole(db)
  for(const schema of ['public','private','auth','storage']) {
   await denied(db,`create table ${schema}.validator_escalation(id integer)`)
   await denied(db,`alter schema ${schema} owner to ${validator}`)
  }
  await denied(db,'create schema validator_escalation')
  await denied(db,`alter table public.profiles owner to ${validator}`)
  await denied(db,`alter function public.has_permission(text) owner to ${validator}`)
 } finally {await db.close()}
})

test('PUBLIC EXECUTE regression is detected, including after an ineffective role-specific revoke',async()=>{
 const db=await setup()
 try {
  await db.exec(`set role ${validator}`)
  assert.deepEqual(await accessibleApplicationRoutines(db),[])
  // Administrative harness deliberately injects an offline regression. This is
  // not a remedy: existing-function hardening does not change future defaults.
  await db.exec('reset role')
  await db.exec(`create function public.validator_public_regression() returns text
   language sql security definer set search_path='' as $$ select 'fixture-only'::text $$`)
  await db.exec(`revoke execute on function public.validator_public_regression() from ${validator}`)
  await db.exec(`set role ${validator}`)
  const findings=await accessibleApplicationRoutines(db)
  assert.deepEqual(findings,[{nspname:'public',proname:'validator_public_regression',signature:'validator_public_regression()'}])
  assert.throws(()=>assert.deepEqual(findings,[]),'a clean routine-ACL gate must reject this regression')
  assert.equal((await db.query('select public.validator_public_regression() as result')).rows[0].result,'fixture-only')
  // Deliberately leave the regression in this disposable DB: no automated repair.
 } finally {await db.close()}
})


const identityPreflight=await readFile(new URL('../supabase/tests/staging-validator-identity.sql',import.meta.url),'utf8')
async function identityRejected(db,sql=identityPreflight) {
 await assert.rejects(db.exec(sql),error=>{
  assert.equal(error.code,'42501')
  assert.equal(error.message,'VALIDATOR_IDENTITY_REJECTED')
  return true
 })
}

test('unmodified identity preflight rejects administrator, SET ROLE session mismatch, and wrong database',async()=>{
 const db=await setup()
 try {
  await identityRejected(db)
  await db.exec(`set role ${validator}`)
  await identityRejected(db)
  await db.exec(`reset role; set session authorization ${validator}`)
  const identity=(await db.query('select session_user,current_user,current_database() as database')).rows[0]
  assert.equal(identity.session_user,validator)
  assert.equal(identity.current_user,validator)
  assert.equal(identity.database,'template1')
  await identityRejected(db)
 } finally {await db.close()}
})

test('identity authority gates reject elevated flags, memberships, ownership and CREATE in a database-adapted offline simulation',async t=>{
 const db=await setup()
 try {
  // PGlite uses template1 even when configured with database: postgres.
  // Adapt ONLY the expected database for gate testing; the shipped SQL remains
  // postgres-only. SET SESSION AUTHORIZATION is harness simulation, NOT proof
  // of NOLOGIN authentication or of actual login/SET ROLE restrictions.
  const simulated=identityPreflight.replace("pg_catalog.current_database() = 'postgres'","pg_catalog.current_database() = 'template1'")
  assert.notEqual(simulated,identityPreflight)
  await identityRejected(db,simulated)
  await db.exec(`set role ${validator}`)
  await identityRejected(db,simulated)
  await db.exec(`reset role; set session authorization ${validator}`)
  await db.exec(simulated)
  for(const [enable,disable] of [
   ['superuser','nosuperuser'],['createdb','nocreatedb'],['createrole','nocreaterole'],
   ['replication','noreplication'],['bypassrls','nobypassrls'],
  ]) {
   await db.exec(`set session authorization postgres; alter role ${validator} ${enable}; set session authorization ${validator}`)
   await identityRejected(db,simulated)
   await db.exec(`set session authorization postgres; alter role ${validator} ${disable}; set session authorization ${validator}`)
   await db.exec(simulated)
  }
  // Explicitly restore the administrative harness identity between fixtures.
  // PGlite RESET SESSION AUTHORIZATION does not restore it here; this is not
  // evidence about whether a real validator login could switch identities.
  // Disposable negative-fixture changes only: never executed against staging.
  await db.exec(`set session authorization postgres; grant authenticated to ${validator}; set session authorization ${validator}`)
  await identityRejected(db,simulated)
  await db.exec(`set session authorization postgres; revoke authenticated from ${validator}; set session authorization ${validator}`)
  await db.exec(simulated)
  await t.test('database CREATE grant is rejected when the fixture engine supports database ACL changes',async subtest=>{
   await db.exec('set session authorization postgres')
   try {
    await db.exec(`grant create on database template1 to ${validator}`)
   } catch(error) {
    // PGlite 0.3.14 cannot mutate this shared database ACL here. Never treat
    // that engine failure as evidence that the identity guard rejected CREATE.
    if(error.code!=='XX000' || error.message!=='tuple concurrently deleted') throw error
    subtest.skip('PGlite database ACL mutation unsupported (XX000); real PostgreSQL negative test still required')
    return
   }
   await db.exec(`set session authorization ${validator}`)
   await identityRejected(db,simulated)
   await db.exec(`set session authorization postgres; revoke create on database template1 from ${validator}; set session authorization ${validator}`)
   await db.exec(simulated)
  })
  await db.exec(`set session authorization postgres; create table public.validator_owned_fixture(id integer); alter table public.validator_owned_fixture owner to ${validator}; set session authorization ${validator}`)
  await identityRejected(db,simulated)
  await db.exec(`set session authorization postgres; alter table public.validator_owned_fixture owner to postgres; set session authorization ${validator}`)
  await db.exec(simulated)
  for(const schema of ['public','private','auth','storage','extensions']) {
   await db.exec(`set session authorization postgres; grant create on schema ${schema} to ${validator}; set session authorization ${validator}`)
   await identityRejected(db,simulated)
   await db.exec(`set session authorization postgres; revoke create on schema ${schema} from ${validator}; set session authorization ${validator}`)
   await db.exec(simulated)
  }
 } finally {await db.close()}
})
