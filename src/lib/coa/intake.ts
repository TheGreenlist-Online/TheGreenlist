/** The intake boundary: original bytes and submitter claims, never analytical results. */
export const COA_MAX_BYTES = 3 * 1024 * 1024
export const COA_MAX_BODY_BYTES = COA_MAX_BYTES + 64 * 1024
export const COA_BUCKET = 'coa-sources'
export const COA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function optionalClaim(value: FormDataEntryValue | null, label: string): string | null {
  if (value === null || value === '') return null
  if (typeof value !== 'string' || value.trim().length > 160 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new IntakeError(400, `${label} must be at most 160 characters without control characters.`)
  }
  return value.trim() || null
}

export class IntakeError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export function validatePdf(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > COA_MAX_BYTES) throw new IntakeError(400, 'Choose one PDF up to 3 MB.')
  if (mime !== 'application/pdf' || !new TextDecoder().decode(bytes.subarray(0, 8)).match(/^%PDF-1\.[0-7]|^%PDF-2\.0/)) {
    throw new IntakeError(400, 'The file must contain a PDF, not an image or web page renamed as a PDF.')
  }
  if (!/%%EOF\s*$/.test(new TextDecoder().decode(bytes.subarray(-1024)))) {
    throw new IntakeError(400, 'The PDF appears incomplete. Download the original certificate and try again.')
  }
  // Signature/envelope check only. No parsing, rendering, OCR or malware-safety claim.
}

export async function readBoundedBody(request: Request): Promise<Uint8Array> {
  const declared = request.headers.get('content-length')
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > COA_MAX_BODY_BYTES)) {
    throw new IntakeError(413, 'Submission exceeds the 3 MB PDF limit.')
  }
  if (!request.body) throw new IntakeError(400, 'Choose a PDF.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.length
      if (total > COA_MAX_BODY_BYTES) {
        await reader.cancel()
        throw new IntakeError(413, 'Submission exceeds the 3 MB PDF limit.')
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const body = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length }
  return body
}

export type CoaReservation = {
  id: string
  owner_id: string
  storage_path: string
  source_sha256: string
  file_size: number
  product_name_reported: string | null
  batch_identifier_reported: string | null
}
export type CoaExisting = CoaReservation & { intake_status: string }
export type IntakeStore = {
  reserve: (record: CoaReservation) => Promise<'created' | CoaExisting>
  upload: (path: string, bytes: Uint8Array) => Promise<void>
  complete: (id: string) => Promise<void>
  fail: (id: string) => Promise<void>
  remove: (path: string) => Promise<void>
}

export async function persistCoa(store: IntakeStore, record: CoaReservation, bytes: Uint8Array) {
  const reservation = await store.reserve(record)
  if (reservation !== 'created') {
    const same = reservation.owner_id === record.owner_id && reservation.source_sha256 === record.source_sha256
      && reservation.product_name_reported === record.product_name_reported
      && reservation.batch_identifier_reported === record.batch_identifier_reported
    if (same && reservation.intake_status === 'submitted') return record.id
    throw new IntakeError(409, 'This submission is already in progress or cannot be reused. Check your submissions before trying again.')
  }
  let uploaded = false
  try {
    await store.upload(record.storage_path, bytes)
    uploaded = true
    await store.complete(record.id)
  } catch {
    // A failed/ambiguous Storage response may still have written bytes. A pending
    // row is never displayed as received, and its source cannot be downloaded.
    // Do not remove after a possibly committed completion: keep bytes recoverable.
    if (!uploaded) await store.remove(record.storage_path).catch(() => {})
    // Only pending rows may transition to failed; a committed receipt is immutable.
    await store.fail(record.id).catch(() => {})
    throw new IntakeError(503, 'Receipt could not be confirmed. Check your submissions before retrying. Incomplete uploads are not marked received.')
  }
  return record.id
}
