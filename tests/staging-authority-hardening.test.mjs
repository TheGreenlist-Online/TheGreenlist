import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
import {fresh,restore} from './staging-baseline-helpers.mjs'

const hardening=await readFile(new URL('../supabase/bootstrap/staging-completion/90-authority-hardening.sql',import.meta.url),'utf8')
const owner='90000000-0000-4000-8000-000000000001'
const unrelated='90000000-0000-4000-8000-000000000002'
const rolesCode=ts.transpileModule(await readFile(new URL('../src/lib/roles.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const app=await import(`data:text/javascript;base64,${Buffer.from(rolesCode).toString('base64')}`)
async function actor(db,id,claims={}) {
 await db.exec('reset role')
 await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[id,JSON.stringify(claims)])
 await db.exec('set role authenticated')
}
async function setup() {
 const db=await fresh()
 await restore(db)
 await db.exec(hardening)
 await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'owner@example.invalid','{\"platform_owner\":true}'),($2,'other@example.invalid','{}')",[owner,unrelated])
 await db.query('update profiles set is_public=false where id=$1',[unrelated])
 return db
}

test('strict live owner metadata allows known permissions and rejects unknown permissions',async()=>{
 const db=await setup()
 try {
  await actor(db,owner)
  assert.equal((await db.query('select public.is_platform_owner() as allowed')).rows[0].allowed,true)
  for(const permission of ['platform.admin','business.manage','report.review'])
   assert.equal((await db.query('select public.has_permission($1) as allowed',[permission])).rows[0].allowed,true)
  for(const permission of ['unknown.permission','PLATFORM.ADMIN',' platform.admin','',null])
   assert.equal((await db.query('select public.has_permission($1) as allowed',[permission])).rows[0].allowed,false)
  for(const value of ['"true"','false','null','1','"TRUE"']) {
   await db.exec('reset role')
   await db.query("update auth.users set raw_app_meta_data=jsonb_build_object('platform_owner',$1::jsonb) where id=$2",[value,owner])
   await actor(db,owner,{app_metadata:{platform_owner:true}})
   assert.equal((await db.query('select public.is_platform_owner() as allowed')).rows[0].allowed,false,value)
   assert.equal((await db.query("select public.has_permission('platform.admin') as allowed")).rows[0].allowed,false,value)
  }
 } finally {await db.close()}
})

test('profile policies reject stale owner JWTs, string metadata and forged user metadata',async()=>{
 const db=await setup()
 try {
  await actor(db,owner)
  assert.equal((await db.query('select id from profiles where id=$1',[unrelated])).rows.length,1)
  for(const metadata of ['{}','{"platform_owner":"true"}']) {
   await db.exec('reset role')
   await db.query("update auth.users set raw_app_meta_data=$1::jsonb,raw_user_meta_data='{\"platform_owner\":true}' where id=$2",[metadata,owner])
   await actor(db,owner,{app_metadata:{platform_owner:true},user_metadata:{platform_owner:true}})
   assert.equal((await db.query('select id from profiles where id=$1',[unrelated])).rows.length,0)
   assert.equal((await db.query("update profiles set display_name='forged edit' where id=$1 returning id",[unrelated])).rows.length,0)
   assert.equal((await db.query('select id from profiles where id=$1',[owner])).rows.length,1)
  }
 } finally {await db.close()}
})

test('hardening leaves no PUBLIC application RPCs or client maintenance/trigger privileges',async()=>{
 const db=await setup()
 try {
  const publicExecute=(await db.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
   where n.nspname in ('public','private') and a.grantee=0 and a.privilege_type='EXECUTE'`)).rows
  assert.deepEqual(publicExecute,[])
  for(const role of ['anon','authenticated']) {
   const privileges=(await db.query(`select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname in ('public','private') and c.relkind in ('r','p','v')
    and has_table_privilege($1,c.oid,'MAINTAIN,TRUNCATE,REFERENCES,TRIGGER')`,[role])).rows
   assert.deepEqual(privileges,[])
  }
  assert.equal((await db.query(`select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname in ('public','private') and c.relkind in ('r','p') and c.relforcerowsecurity`)).rows[0].n,30)
  await actor(db,unrelated)
  assert.equal((await db.query("select has_permission('profile.read.self') as allowed")).rows[0].allowed,true)
  assert.equal((await db.query("select has_permission('platform.admin') as allowed")).rows[0].allowed,false)
 } finally {await db.close()}
})

test('all six platform roles retain exact permission mapping after hardening',async()=>{
 const db=await setup()
 try {
  for(const [index,role] of app.PLATFORM_ROLES.entries()) {
   const id=`80000000-0000-4000-8000-00000000000${index+1}`
   await db.exec('reset role')
   await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,$2,'{\"role\":\"ADMIN\",\"platform_owner\":true}')",[id,`${role.toLowerCase()}@example.invalid`])
   assert.equal((await db.query('select role::text from profiles where id=$1',[id])).rows[0].role,'USER')
   await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
   await db.query('update profiles set role=$1::app_role where id=$2',[role,id])
   await actor(db,id,{app_metadata:{platform_owner:true,role:'ADMIN'}})
   for(const permission of app.PLATFORM_PERMISSIONS) {
    assert.equal((await db.query('select has_permission($1) as allowed',[permission])).rows[0].allowed,app.hasPermission(role,permission),`${role}:${permission}`)
   }
   assert.equal((await db.query("select has_permission('unregistered.permission') as allowed")).rows[0].allowed,false)
  }
 } finally {await db.close()}
})
