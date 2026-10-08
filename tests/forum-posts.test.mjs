import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

// Execute the actual route with a session client stub, including a successful
// unlocked pre-check followed by a database rejection (the concurrent-lock gap).
const source = fs.readFileSync(new URL('../src/app/api/forum-posts/route.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function route({ user = { id: 'actor' }, locked = false, dbError = null } = {}) {
  const supabase = {
    auth: { getUser: async () => ({ data: { user } }) },
    from(table) {
      if (table === 'forum_threads') return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'thread', is_locked: locked }, error: null }) }) }),
      }
      return { insert: () => ({ select: () => ({ single: async () => ({ data: dbError ? null : { id: 'reply' }, error: dbError }) }) }) }
    },
  }
  const exports = {}
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (body, { status = 200 } = {}) => ({ body, status }) } }
      if (name === '@/lib/supabase/server') return { createSupabaseServerClient: async () => supabase }
      throw new Error(`Unexpected import ${name}`)
    },
    console: { error() {} },
  })
  return exports.POST({ json: async () => ({ thread_id: 'thread', body: 'A valid reply' }) })
}
test('database lock rejection after an unlocked pre-check returns 403', async () => {
  const result = await route({ dbError: { code: '42501', message: 'private database detail' } })
  assert.equal(result.status, 403)
  assert.match(result.body.error, /unlocked thread/)
  assert.ok(!result.body.error.includes('private database detail'))
})
test('database body limit returns 400', async () => assert.equal((await route({ dbError: { code: '22001' } })).status, 400))
test('unrelated database failure remains 500', async () => assert.equal((await route({ dbError: { code: 'XX000' } })).status, 500))
test('valid reply returns 201', async () => assert.equal((await route()).status, 201))
test('pre-check locked thread returns 403', async () => assert.equal((await route({ locked: true })).status, 403))
test('signed-out caller returns 401', async () => assert.equal((await route({ user: null })).status, 401))
