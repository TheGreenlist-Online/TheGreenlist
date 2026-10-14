import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'
import { z } from 'zod'
const compile = path => ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const validators = {}
vm.runInNewContext(compile('../src/utils/validators.ts'), { exports: validators, require: () => ({ z }) })
const compiled = compile('../src/app/api/posts/route.ts')
async function route({ dbError = null, user = { id: 'actor' }, content = 'x'.repeat(50001) } = {}) {
  const exports = {}
  vm.runInNewContext(compiled, {
    exports, crypto: { randomUUID: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, console: { error() {} },
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (body, { status = 200 } = {}) => ({ body, status }) } }
      if (name === '@/lib/write-quota') return { writeQuotaResponse: () => null }
      if (name === '@/utils/validators') return validators
      if (name === '@/lib/supabase/server') return { createSupabaseServerClient: async () => ({
        auth: { getUser: async () => ({ data: { user } }) },
        from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'thread' }, error: dbError }) }) }) }),
      }) }
      throw new Error(`Unexpected import ${name}`)
    },
  })
  return exports.POST({ json: async () => ({ title: 'A thread', forumId: 'forum', content }) })
}
test('oversized thread database error is a sanitized 400', async () => {
  const result = await route({ dbError: { code: '22001', message: 'private database detail' } })
  assert.equal(result.status, 400)
  assert.match(result.body.error, /50,000/)
  assert.ok(!result.body.error.includes('private database detail'))
})
test('unrelated thread failure remains generic 500', async () => {
  const result = await route({ dbError: { code: 'XX000', message: 'private detail' } })
  assert.equal(result.status, 500)
  assert.equal(result.body.error, 'Failed to create post')
})
test('valid thread at length boundary preserves success', async () => assert.equal((await route({ content: 'x'.repeat(50000) })).status, 200))
test('signed-out thread creation remains 401', async () => assert.equal((await route({ user: null })).status, 401))
