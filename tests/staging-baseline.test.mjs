import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import {readFile} from 'node:fs/promises'
import {fresh as freshDatabase,restore,fingerprint,read} from './staging-baseline-helpers.mjs'
const code=ts.transpileModule(await readFile(new URL('../src/lib/roles.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const app=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const invalid=['admin','Admin',' ADMIN','ADMIN ','Administrator','owner','editor','viewer','unknown','ＡＤＭＩＮ','ADMIN\u200b','',null]

test('two fresh captured baseline restores match fingerprints and rollback/replay fail safely',async()=>{
 const expected=JSON.parse(await read('catalog-fingerprint.json'))
 for(let i=0;i<2;i++) {
  const db=await freshDatabase()
  try {
   await restore(db,{rollback:true})
   assert.equal((await db.query("select to_regclass('public.profiles') as relation")).rows[0].relation,null)
   await restore(db)
   assert.deepEqual(await fingerprint(db),expected)
   await assert.rejects(restore(db),/empty application schema/)
   assert.deepEqual(await fingerprint(db),expected)
  } finally {await db.close()}
 }
})

test('recovered SQL enforces canonical roles, signup defaults, self isolation and exact permission mapping',async()=>{
  const db=await freshDatabase()
  const owner='00000000-0000-4000-8000-000000000001'
  const actors=app.PLATFORM_ROLES.map((role,i)=>({role,id:`10000000-0000-4000-8000-00000000000${i+1}`}))
  const actor=async(id='',role='authenticated',claims={})=>{
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[id,JSON.stringify(claims)])
    await db.exec(`set role ${role}`)
  }
  try {
    await restore(db)
    await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'owner@example.invalid','{\"platform_owner\":true}')",[owner])
    for(const a of actors) {
      await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,$2,'{\"role\":\"ADMIN\",\"platform_owner\":true}')",[a.id,`${a.role.toLowerCase()}@example.invalid`])
      assert.equal((await db.query('select role::text from profiles where id=$1',[a.id])).rows[0].role,'USER')
    }
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
    for(const a of actors) await db.query('update profiles set role=$1::app_role where id=$2',[a.role,a.id])
    for(const a of actors) {
      await actor(a.id,'authenticated',{app_metadata:{role:'ADMIN',platform_owner:true}})
      for(const permission of app.PLATFORM_PERMISSIONS) {
        const result=(await db.query('select public.has_permission($1) as allowed',[permission])).rows[0].allowed
        assert.equal(result,app.hasPermission(a.role,permission),`${a.role}:${permission}`)
      }
      assert.equal((await db.query('select public.has_role($1,$2::app_role) as allowed',[a.id,a.role])).rows[0].allowed,true)
      if(a.role!=='ADMIN') {
        assert.equal((await db.query('select public.platform_role($1) as role',[owner])).rows[0].role,null)
        await assert.rejects(db.query("update profiles set role='ADMIN' where id=$1",[a.id]),/Only the platform owner/)
      }
    }
    await actor('','anon')
    assert.equal((await db.query("select has_permission('platform.admin') as allowed")).rows[0].allowed,false)
    await actor('','service_role')
    const receipt='30000000-0000-4000-8000-000000000001'
    const path=`${actors[0].id}/${receipt}/original.pdf`
    await db.query('insert into coa_reports(id,owner_id,storage_path,source_sha256,file_size) values($1,$2,$3,$4,40)',[receipt,actors[0].id,path,'a'.repeat(64)])
    await db.query("insert into storage.objects(bucket_id,name) values('coa-sources',$1)",[path])
    for(const [id,claims,count] of [[actors[0].id,{},1],[actors[1].id,{app_metadata:{role:'ADMIN'}},0],[actors[0].id,{is_anonymous:true},0]]) {
      await actor(id,'authenticated',claims)
      assert.equal((await db.query('select count(*)::int n from coa_reports')).rows[0].n,count)
      assert.equal((await db.query("select count(*)::int n from storage.objects where bucket_id='coa-sources'")).rows[0].n,0)
      await assert.rejects(db.exec("insert into storage.objects(bucket_id,name) values('coa-sources','forged.pdf')"),/row-level security/)
      await assert.rejects(db.exec('delete from coa_reports'),/permission denied/)
    }
    await actor('','anon')
    await assert.rejects(db.exec('select * from coa_reports'),/permission denied/)
    await db.exec('reset role')
    for(const role of ['anon','authenticated']) {
      const unsafe=(await db.query("select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and (has_table_privilege($1,c.oid,'TRUNCATE') or has_table_privilege($1,c.oid,'TRIGGER') or has_table_privilege($1,c.oid,'REFERENCES'))",[role])).rows
      assert.deepEqual(unsafe,[])
    }
    for(const value of invalid.filter(v=>typeof v==='string' && !v.includes('\0'))) {
      await assert.rejects(db.query('select $1::public.app_role',[value]),/invalid input value for enum/)
    }
    // Organization identifiers are lowercase, scoped values, never platform aliases.
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
    const business='20000000-0000-4000-8000-000000000001'
    await db.query("insert into business_profiles(id,name,slug,business_type,owner_id) values($1,'Synthetic organization','synthetic-org','other',$2)",[business,actors[1].id])
    const orgRoles=['admin','editor','viewer']
    for(let i=0;i<orgRoles.length;i++) await db.query('insert into organization_memberships(organization_id,user_id,role) values($1,$2,$3)',[business,actors[i+2].id,orgRoles[i]])
    for(const role of ['ADMIN','Admin',' admin ','OWNER','member','unknown']) {
      await assert.rejects(db.query('insert into organization_memberships(organization_id,user_id,role) values($1,$2,$3)',[business,actors[0].id,role]),/check constraint/)
    }
    await actor(actors[2].id)
    assert.equal((await db.query("select has_permission('platform.admin') as allowed")).rows[0].allowed,false)
    assert.equal((await db.query('select can_manage_organization_members($1) as allowed',[business])).rows[0].allowed,true)
    await actor(actors[0].id)
    assert.equal((await db.query('select count(*)::int n from organization_memberships')).rows[0].n,0)
    assert.equal((await db.query('select can_manage_organization_members($1) as allowed',[business])).rows[0].allowed,false)
    await db.exec('reset role')
    assert.equal((await db.query('select count(*)::int n from role_permissions')).rows[0].n,42)
    // Retained source behavior requiring a separate database-hardening decision.
    await db.query("update auth.users set raw_app_meta_data='{\"platform_owner\":\"true\"}' where id=$1",[owner])
    await actor(owner)
    assert.equal((await db.query('select public.is_platform_owner() as owner')).rows[0].owner,true)
    assert.equal((await db.query("select public.has_permission('unknown.permission') as allowed")).rows[0].allowed,true)
  } finally { await db.close() }
})
