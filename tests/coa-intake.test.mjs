import assert from 'node:assert/strict'
import test from 'node:test'
import { COA_MAX_BODY_BYTES, COA_MAX_BYTES, IntakeError, optionalClaim, persistCoa, readBoundedBody, validatePdf } from '../src/lib/coa/intake.ts'

const pdf = new TextEncoder().encode('%PDF-1.7\nOriginal immutable certificate\n%%EOF\n')
const record = { id: 'f1717267-1c1f-4c6a-b997-f5e84e545ff8', owner_id: 'owner', storage_path: 'owner/id/original.pdf', source_sha256: 'a'.repeat(64), file_size: pdf.length, product_name_reported: null, batch_identifier_reported: '0000123456789012345678901234' }
function store() {
  const calls = []
  return { calls,
    async reserve(row) { calls.push(['reserve', row]); return 'created' },
    async upload(path, bytes) { calls.push(['upload', path, bytes]) },
    async complete(id) { calls.push(['complete', id]) },
    async fail(id) { calls.push(['fail', id]) },
    async remove(path) { calls.push(['remove', path]) },
  }
}

test('PDF validation rejects renamed images, wrong MIME, truncation, empty and oversized files', () => {
  validatePdf(pdf, 'application/pdf')
  for (const [bytes, mime] of [[pdf, 'image/png'], [new TextEncoder().encode('image renamed.pdf'), 'application/pdf'], [pdf.subarray(0, 12), 'application/pdf'], [new Uint8Array(), 'application/pdf'], [new Uint8Array(COA_MAX_BYTES + 1), 'application/pdf']]) {
    assert.throws(() => validatePdf(bytes, mime), IntakeError)
  }
})
test('batch identifiers remain text and optional unknown claims remain null', () => {
  assert.equal(optionalClaim(record.batch_identifier_reported, 'Batch'), record.batch_identifier_reported)
  assert.equal(optionalClaim('  ', 'Batch'), null)
  assert.throws(() => optionalClaim('x'.repeat(161), 'Batch'), IntakeError)
  assert.throws(() => optionalClaim('x\n', 'Batch'), IntakeError)
})
test('request body is bounded without trusting Content-Length and cancels overflow', async () => {
  let cancelled = false
  const body = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(COA_MAX_BODY_BYTES + 1)) }, cancel() { cancelled = true } })
  await assert.rejects(readBoundedBody(new Request('https://example.test', { method: 'POST', body, duplex: 'half' })), { status: 413 })
  assert.equal(cancelled, true)
  await assert.rejects(readBoundedBody(new Request('https://example.test', { method: 'POST', body: pdf, headers: { 'Content-Length': String(COA_MAX_BODY_BYTES + 1) } })), { status: 413 })
  assert.deepEqual(await readBoundedBody(new Request('https://example.test', { method: 'POST', body: pdf })), pdf)
})
test('neutral intake preserves exact bytes and records success only after upload', async () => {
  const backend = store()
  assert.equal(await persistCoa(backend, record, pdf), record.id)
  assert.deepEqual(backend.calls.map(c => c[0]), ['reserve', 'upload', 'complete'])
  assert.equal(backend.calls[1][2], pdf)
  assert.equal('report_id' in backend.calls[0][1], false)
})
test('a lost successful response is replayable without another object or receipt', async () => {
  const backend = store()
  backend.reserve = async () => ({ ...record, intake_status: 'submitted' })
  assert.equal(await persistCoa(backend, record, pdf), record.id)
  assert.deepEqual(backend.calls, [])
})
test('foreign owner, changed source/claims, and incomplete reservations cannot replay', async () => {
  for (const patch of [{ owner_id: 'other' }, { source_sha256: 'b'.repeat(64) }, { batch_identifier_reported: 'other' }, { intake_status: 'upload_pending' }, { intake_status: 'upload_failed' }]) {
    const backend = store()
    backend.reserve = async () => ({ ...record, intake_status: 'submitted', ...patch })
    await assert.rejects(persistCoa(backend, record, pdf), { status: 409 })
    assert.deepEqual(backend.calls, [])
  }
})
test('failed/ambiguous uploads are never marked received and cleanup is attempted', async () => {
  const backend = store()
  backend.upload = async () => { throw new Error('ambiguous Storage write') }
  await assert.rejects(persistCoa(backend, record, pdf), { status: 503 })
  assert.deepEqual(backend.calls.map(c => c[0]), ['reserve', 'remove', 'fail'])
})
test('ambiguous receipt commit keeps original bytes recoverable rather than deleting them', async () => {
  const backend = store()
  backend.complete = async () => { throw new Error('commit response lost') }
  await assert.rejects(persistCoa(backend, record, pdf), { status: 503 })
  assert.deepEqual(backend.calls.map(c => c[0]), ['reserve', 'upload', 'fail'])
})
test('quota denial happens before Storage receives bytes', async () => {
  const backend = store()
  backend.reserve = async () => { throw new IntakeError(429, 'quota') }
  await assert.rejects(persistCoa(backend, record, pdf), { status: 429 })
  assert.deepEqual(backend.calls, [])
})
