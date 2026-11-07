import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

const modules = [
  'openai.ts',
  'supabase/admin.ts',
  'integrations/n8n.ts',
  'integrations/gohighlevel.ts',
]

for (const name of modules) {
  test(`${name} rejects client imports`, () => {
    const source = fs.readFileSync(new URL(`../src/lib/${name}`, import.meta.url), 'utf8')
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText
    assert.throws(() => vm.runInNewContext(compiled, {
      exports: {},
      require(id) {
        assert.equal(id, 'server-only', 'boundary must run before loading credentials or SDKs')
        throw new Error('Client import forbidden')
      },
    }), /Client import forbidden/)
  })
}

test('n8n never returns or logs fetch error details or exports raw configuration', async () => {
  const source = fs.readFileSync(new URL('../src/lib/integrations/n8n.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  const logs = []
  vm.runInNewContext(compiled, {
    exports,
    require(id) { assert.equal(id, 'server-only'); return {} },
    process: { env: { N8N_WEBHOOK_URL: 'https://automation.example/webhook/test', N8N_API_KEY: 'test-fixture-key' } },
    console: { log: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    fetch: async () => { throw new Error('request leaked test-fixture-key') },
  })
  const result = await exports.n8n.send('test', {})
  assert.equal(result.ok, false)
  assert.equal(result.error, 'Webhook request failed')
  assert.equal(JSON.stringify({ result, logs }).includes('test-fixture-key'), false)
  assert.equal('config' in exports.n8n, false)
})
