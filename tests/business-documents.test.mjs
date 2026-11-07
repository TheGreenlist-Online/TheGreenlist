import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

// Exercise the real GET handler; stub only authorization and Supabase I/O.
const source = fs.readFileSync(new URL('../src/app/api/admin/business-documents/route.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText

async function getDocuments({ user = { id: 'reviewer' }, authorized = true, rows = [], dbError = null } = {}) {
  const calls = { tables: [], filters: [], signedPaths: [] }
  const query = {
    select() { return this },
    order() { return this },
    eq(column, value) { calls.filters.push([column, value]); return this },
    then(resolve, reject) { return Promise.resolve({ data: rows, error: dbError }).then(resolve, reject) },
  }
  const supabase = {
    from(table) { calls.tables.push(table); return query },
    storage: {
      from(bucket) {
        assert.equal(bucket, 'business-documents')
        return {
          async createSignedUrl(path, expiresIn) {
            calls.signedPaths.push({ path, expiresIn })
            return { data: { signedUrl: 'https://storage.example.invalid/signed-document' } }
          },
        }
      },
    },
  }
  const exports = {}
  vm.runInNewContext(compiled, {
    exports,
    URL,
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (body, { status = 200 } = {}) => ({ body, status }) } }
      if (name === '@/lib/supabase/authz') return { requireAdmin: async () => ({ user, authorized, supabase }) }
      throw new Error(`Unexpected import ${name}`)
    },
    console: { error() {} },
  })
  const response = await exports.GET({ url: 'https://app.example.invalid/api/admin/business-documents' })
  return { response, calls }
}

for (const path of ['../other-business/license.pdf', 'business/../../private/license.pdf', 'business/../license.pdf']) {
  test(`rejects traversal before asking Storage to sign: ${path}`, async () => {
    const { response, calls } = await getDocuments({ rows: [{ id: 'document', file_url: path }] })
    assert.equal(response.status, 500)
    assert.equal(response.body.error, 'Internal server error')
    assert.deepEqual(calls.signedPaths, [])
    assert.ok(!JSON.stringify(response.body).includes(path))
  })
}

test('valid object path is signed unchanged for one hour and returned with its row', async () => {
  const path = 'business-id/actor-id/license.pdf'
  const { response, calls } = await getDocuments({ rows: [{ id: 'document', title: 'License', file_url: path }] })
  assert.equal(response.status, 200)
  assert.deepEqual(calls.tables, ['business_documents'])
  assert.deepEqual(calls.filters, [['status', 'pending_review']])
  assert.deepEqual(calls.signedPaths, [{ path, expiresIn: 3600 }])
  assert.equal(response.body[0].id, 'document')
  assert.equal(response.body[0].title, 'License')
  assert.equal(response.body[0].file_url, 'https://storage.example.invalid/signed-document')
})

test('signed-out requests are rejected before querying or signing documents', async () => {
  const { response, calls } = await getDocuments({ user: null })
  assert.equal(response.status, 401)
  assert.deepEqual(calls.tables, [])
  assert.deepEqual(calls.signedPaths, [])
})

test('non-admin requests are rejected before querying or signing documents', async () => {
  const { response, calls } = await getDocuments({ authorized: false })
  assert.equal(response.status, 403)
  assert.deepEqual(calls.tables, [])
  assert.deepEqual(calls.signedPaths, [])
})

test('database errors return a generic failure without signing a path', async () => {
  const { response, calls } = await getDocuments({ dbError: { message: 'private database detail' } })
  assert.equal(response.status, 500)
  assert.equal(response.body.error, 'Internal server error')
  assert.deepEqual(calls.signedPaths, [])
})
