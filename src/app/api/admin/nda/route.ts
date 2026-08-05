import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/authz'
import { NDA_DOCUMENT_VERSION, type NdaSignatureRow } from '@/types/moderation'

export async function GET() {
  try {
    const principal = await requireAdmin()

    if (!principal.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!principal.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data, error } = await principal.supabase
      .from('nda_signatures')
      .select('*')
      .eq('user_id', principal.user.id)
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    const signature = (data ?? null) as NdaSignatureRow | null

    return NextResponse.json({
      signed: Boolean(signature),
      signature,
      documentVersion: NDA_DOCUMENT_VERSION,
    })
  } catch (error) {
    console.error('Error checking NDA status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const principal = await requireAdmin()

    if (!principal.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!principal.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null

    const { data, error } = await principal.supabase
      .from('nda_signatures')
      .insert({
        user_id: principal.user.id,
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        document_version: NDA_DOCUMENT_VERSION,
      })
      .select()
      .single()

    if (error) throw error

    await principal.supabase.from('audit_logs').insert({
      actor_id: principal.user.id,
      action: 'nda.signed',
      target_type: 'nda_signatures',
      target_id: (data as NdaSignatureRow).id,
      metadata: { document_version: NDA_DOCUMENT_VERSION },
    })

    return NextResponse.json({ signed: true, signature: data as NdaSignatureRow }, { status: 201 })
  } catch (error) {
    console.error('Error recording NDA signature:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
