import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { COA_BUCKET, COA_UUID, IntakeError, optionalClaim, persistCoa, readBoundedBody, validatePdf, type CoaExisting } from '@/lib/coa/intake'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    if (process.env.COA_INTAKE_ENABLED !== 'true') return NextResponse.json({ error: 'COA intake is not yet available.' }, { status: 503 })
    if (request.headers.get('origin') !== new URL(request.url).origin) {
      return NextResponse.json({ error: 'Submit from The Green List form.' }, { status: 403 })
    }
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user || user.is_anonymous) return NextResponse.json({ error: 'Sign in before submitting a COA.' }, { status: 401 })
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.startsWith('multipart/form-data;')) throw new IntakeError(400, 'Use the PDF submission form.')
    const body = await readBoundedBody(request)
    const form = await new Response(body as BodyInit, { headers: { 'content-type': contentType } }).formData().catch(() => { throw new IntakeError(400, 'The submission form could not be read.') })
    const allowed = new Set(['id', 'pdf', 'product', 'batch', 'consent'])
    for (const key of Array.from(form.keys())) {
      if (!allowed.has(key) || form.getAll(key).length !== 1) throw new IntakeError(400, 'Unexpected or repeated submission field.')
    }
    const rawId = form.get('id')
    const id = typeof rawId === 'string' ? rawId.toLowerCase() : rawId
    if (typeof id !== 'string' || !COA_UUID.test(id)) throw new IntakeError(400, 'Invalid submission reference.')
    if (form.get('consent') !== 'yes') throw new IntakeError(400, 'Confirm permission to submit the original PDF privately.')
    const file = form.get('pdf')
    if (!(file instanceof File)) throw new IntakeError(400, 'Choose one PDF.')
    const bytes = new Uint8Array(await file.arrayBuffer())
    validatePdf(bytes, file.type)
    const record = {
      id, owner_id: user.id, storage_path: `${user.id}/${id}/original.pdf`,
      source_sha256: createHash('sha256').update(bytes).digest('hex'), file_size: bytes.length,
      product_name_reported: optionalClaim(form.get('product'), 'Product name'),
      batch_identifier_reported: optionalClaim(form.get('batch'), 'Batch identifier'),
    }
    const admin = createSupabaseAdminClient()
    const receipt = await persistCoa({
      async reserve(row) {
        const { error: insertError } = await admin.from('coa_reports').insert(row)
        if (!insertError) return 'created'
        if (insertError.code === 'PT429') throw new IntakeError(429, 'COA intake limit reached (5 attempts per day, 50 total). Contact support if you need more.')
        if (insertError.code !== '23505') throw new IntakeError(503, 'COA intake is not ready. Please try later.')
        const { data } = await admin.from('coa_reports').select('id,owner_id,storage_path,source_sha256,file_size,product_name_reported,batch_identifier_reported,intake_status').eq('id', id).eq('owner_id', user.id).maybeSingle<CoaExisting>()
        if (!data) throw new IntakeError(409, 'This reference cannot be reused. Start a new submission.')
        return data
      },
      async upload(path, content) {
        const { error } = await admin.storage.from(COA_BUCKET).upload(path, content, { contentType: 'application/pdf', upsert: false, cacheControl: '0' })
        if (error) throw error
      },
      async complete(receiptId) {
        const { data, error } = await admin.from('coa_reports').update({ intake_status: 'submitted', received_at: new Date().toISOString() }).eq('id', receiptId).eq('owner_id', user.id).eq('intake_status', 'upload_pending').select('id').single()
        if (error || !data) throw error ?? new Error('Receipt missing')
      },
      async fail(receiptId) {
        const { error } = await admin.from('coa_reports').update({ intake_status: 'upload_failed' }).eq('id', receiptId).eq('owner_id', user.id).eq('intake_status', 'upload_pending')
        if (error) throw error
      },
      async remove(path) { const { error } = await admin.storage.from(COA_BUCKET).remove([path]); if (error) throw error },
    }, record, bytes)
    return NextResponse.json({ id: receipt }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof IntakeError) return NextResponse.json({ error: error.message }, { status: error.status, headers: error.status === 429 ? { 'Retry-After': '86400' } : undefined })
    return NextResponse.json({ error: 'COA submission could not be processed. Check your submissions before retrying.' }, { status: 503 })
  }
}
