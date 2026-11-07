import { createHash } from 'node:crypto'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { COA_BUCKET, COA_UUID } from '@/lib/coa/intake'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
  if (process.env.COA_INTAKE_ENABLED !== 'true') return new Response(null, { status: 404, headers })
  const { id } = await params
  if (!COA_UUID.test(id)) return new Response(null, { status: 404, headers })
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return new Response(null, { status: 401, headers })
  const { data: row } = await supabase.from('coa_reports').select('storage_path,source_sha256').eq('id', id).eq('owner_id', user.id).eq('intake_status', 'submitted').maybeSingle<{ storage_path: string; source_sha256: string }>()
  if (!row) return new Response(null, { status: 404, headers })
  const { data, error } = await createSupabaseAdminClient().storage.from(COA_BUCKET).download(row.storage_path)
  if (error || !data) return new Response(null, { status: 503, headers })
  const bytes = await data.arrayBuffer()
  if (createHash('sha256').update(new Uint8Array(bytes)).digest('hex') !== row.source_sha256) return new Response(null, { status: 503, headers })
  return new Response(bytes, { headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="original-coa.pdf"', 'Content-Security-Policy': "sandbox; default-src 'none'" } })
}
