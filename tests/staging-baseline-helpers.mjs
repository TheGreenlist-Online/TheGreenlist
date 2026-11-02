import {readFile,readdir} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
export const root=new URL('../supabase/bootstrap/staging/',import.meta.url)
export const read=path=>readFile(new URL(path,root),'utf8')
export async function fresh() {
  const db=new PGlite()
  await db.exec(await read('../../tests/bootstrap-platform-fixture.sql'))
  return db
}
export async function restore(db,{rollback=false}={}) {
  await db.exec('begin')
  try {
    for(const f of (await readdir(root)).filter(f=>/^\d\d-.*\.sql$/.test(f)).sort()) await db.exec(await read(f))
    await db.exec(rollback?'rollback':'commit')
  } catch(e) {await db.exec('rollback');throw e}
}
export async function fingerprint(db) {
  const results=await db.exec(await read('catalog-fingerprint.sql'))
  return results.find(r=>r.rows?.[0]?.jsonb_build_object).rows[0].jsonb_build_object
}
