import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'
import { createHash } from 'node:crypto'
import * as intake from '../src/lib/coa/intake.ts'

const id = '10000000-0000-4000-8000-000000000001'
const user = { id: '00000000-0000-4000-8000-000000000001' }
const pdf = '%PDF-1.7\nOriginal source\n%%EOF\n'
const compile = file => ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const postCode = compile('../src/app/api/coa/route.ts')
const getCode = compile('../src/app/api/coa/[id]/source/route.ts')
function harness({ enabled = true, actor = user, dbError = null, uploadError = null, row = null } = {}) {
  const calls = []
  const client = { auth: { getUser: async () => ({ data: { user: actor } }) }, from(table) {
    calls.push(['table', table])
    const query = {
      insert(record) { calls.push(['insert', record]); return Promise.resolve({ error: dbError }) },
      update(value) { calls.push(['update', value]); return query },
      select() { return query }, eq(key, value) { calls.push(['eq', key, value]); return query },
      async single() { return { data: { id }, error: null } },
      async maybeSingle() { return { data: row, error: null } },
      then(resolve) { resolve({ error: null }) },
    }
    return query
  } }
  const admin = { ...client, storage: { from(bucket) { calls.push(['bucket', bucket]); return {
    async upload(path, bytes, options) { calls.push(['upload', path, bytes, options]); return { error: uploadError } },
    async remove(paths) { calls.push(['remove', paths]); return { error: null } },
    async download(path) { calls.push(['download', path]); return { data: new Blob([pdf]), error: null } },
  } } } }
  function load(code) {
    const exports = {}
    vm.runInNewContext(code, { exports, Request, Response, File, FormData, URL, Uint8Array, Date, Set, process: { env: { COA_INTAKE_ENABLED: enabled ? 'true' : 'false' } },
      require(name) {
        if (name === 'node:crypto') return { createHash }
        if (name === 'next/server') return { NextResponse: Response }
        if (name === '@/lib/coa/intake') return intake
        if (name === '@/lib/supabase/server') return { createSupabaseServerClient: async () => client }
        if (name === '@/lib/supabase/admin') return { createSupabaseAdminClient: () => admin }
        throw new Error(name)
      },
    })
    return exports
  }
  return { calls, post: load(postCode).POST, get: load(getCode).GET }
}
function request({ origin = 'https://green.test', change = () => {} } = {}) {
  const form = new FormData()
  form.set('id', id); form.set('pdf', new File([pdf], 'private-name.pdf', { type: 'application/pdf' })); form.set('consent', 'yes')
  change(form)
  return new Request('https://green.test/api/coa', { method: 'POST', headers: { origin }, body: form })
}
test('disabled intake and foreign origins fail before auth or persistence', async () => {
  const disabled = harness({ enabled: false })
  assert.equal((await disabled.post(request())).status, 503)
  assert.equal(disabled.calls.length, 0)
  const foreign = harness()
  assert.equal((await foreign.post(request({ origin: 'https://attacker.test' }))).status, 403)
  assert.equal(foreign.calls.length, 0)
})
test('signed-out and anonymous sessions cannot use privileged storage', async () => {
  for (const actor of [null, { ...user, is_anonymous: true }]) {
    const h = harness({ actor })
    assert.equal((await h.post(request())).status, 401)
    assert.equal(h.calls.length, 0)
  }
})
test('server rejects consent omission, repeated fields, spoofed status, renamed images and malformed multipart', async () => {
  for (const change of [f => f.delete('consent'), f => f.append('id', id), f => f.set('authenticity_status', 'verified'), f => f.set('pdf', new File(['image'], 'renamed.pdf', { type: 'application/pdf' }))]) {
    const h = harness()
    assert.equal((await h.post(request({ change }))).status, 400)
    assert.equal(h.calls.length, 0)
  }
  const malformed = new Request('https://green.test/api/coa', { method: 'POST', headers: { origin: 'https://green.test', 'content-type': 'multipart/form-data; boundary=abc' }, body: 'bad' })
  assert.equal((await harness().post(malformed)).status, 400)
})
test('server stores original bytes and a private receipt without creating a report', async () => {
  const h = harness()
  const response = await h.post(request({ change: f => f.set('batch', '0000123456789012345678901234') }))
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { id })
  const record = h.calls.find(c => c[0] === 'insert')[1]
  assert.equal(record.owner_id, user.id)
  assert.equal(record.source_sha256, createHash('sha256').update(pdf).digest('hex'))
  assert.equal(record.batch_identifier_reported, '0000123456789012345678901234')
  assert.ok(h.calls.filter(c => c[0] === 'table').every(c => c[1] === 'coa_reports'))
  const upload = h.calls.find(c => c[0] === 'upload')
  assert.equal(new TextDecoder().decode(upload[2]), pdf)
  assert.equal(upload[3].upsert, false)
  assert.ok(!upload[1].includes('private-name'))
})
test('database quota denies upload; upload errors never produce a received receipt', async () => {
  const quota = harness({ dbError: { code: 'PT429', message: 'private detail' } })
  const response = await quota.post(request())
  assert.equal(response.status, 429)
  assert.ok(!quota.calls.some(c => c[0] === 'upload'))
  assert.ok(!(await response.text()).includes('private detail'))
  const failed = harness({ uploadError: new Error('private storage message') })
  assert.equal((await failed.post(request())).status, 503)
  assert.ok(!failed.calls.some(c => c[0] === 'update' && c[1].intake_status === 'submitted'))
})
test('download authenticates and scopes receipt before touching privileged storage', async () => {
  for (const options of [{ actor: null }, { row: null }]) {
    const h = harness(options)
    assert.equal((await h.get(new Request('https://green.test'), { params: Promise.resolve({ id }) })).status, options.actor === null ? 401 : 404)
    assert.ok(!h.calls.some(c => c[0] === 'download'))
  }
  const h = harness({ row: { storage_path: `${user.id}/${id}/original.pdf`, source_sha256: createHash('sha256').update(pdf).digest('hex') } })
  const response = await h.get(new Request('https://green.test'), { params: Promise.resolve({ id }) })
  assert.equal(response.status, 200)
  assert.ok(h.calls.some(c => c[0] === 'eq' && c[1] === 'owner_id' && c[2] === user.id))
  assert.ok(h.calls.some(c => c[0] === 'eq' && c[1] === 'intake_status' && c[2] === 'submitted'))
  assert.match(response.headers.get('content-disposition'), /^attachment/)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(await response.text(), pdf)
  const altered = harness({ row: { storage_path: 'original.pdf', source_sha256: 'b'.repeat(64) } })
  assert.equal((await altered.get(new Request('https://green.test'), { params: Promise.resolve({ id }) })).status, 503)
})
