import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

const compiled = ts.transpileModule(
  fs.readFileSync(new URL('../src/components/settings/SecuritySettings.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText

test('global sign-out waits for session revocation before client navigation and refresh', async () => {
  const calls = []
  let finishSignOut
  const signedOut = new Promise(resolve => { finishSignOut = resolve })
  const exports = {}
  const jsx = (type, props) => ({ type, props })

  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      if (name === 'react') return {
        useMemo: factory => factory(),
        useState: initial => [initial, () => {}],
      }
      if (name === 'next/navigation') return { useRouter: () => ({
        push: path => calls.push(['push', path]),
        refresh: () => calls.push(['refresh']),
      }) }
      if (name === '@/lib/supabase/client') return { createSupabaseBrowserClient: () => ({
        auth: { signOut: async ({ scope }) => {
          calls.push(['signOut', scope])
          await signedOut
        } },
      }) }
      if (name === '@/components/settings/SettingsSection') return { SettingsSection: 'section' }
      if (name === '@/components/settings/SettingsControls') return { StatusMessage: 'p' }
      throw new Error(`Unexpected import ${name}`)
    },
  })

  const section = exports.SecuritySettings({ email: 'test@example.com' })
  const button = section.props.footer.props.children.find(child => child.type === 'button')
  const signingOut = button.props.onClick()

  assert.deepEqual(calls, [['signOut', 'global']])
  finishSignOut()
  await signingOut
  assert.deepEqual(calls, [
    ['signOut', 'global'],
    ['push', '/'],
    ['refresh'],
  ])
})
