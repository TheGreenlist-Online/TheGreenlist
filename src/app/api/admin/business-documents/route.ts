import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/authz'

const ALLOWED_STATUSES = ['pending_review', 'approved', 'rejected']

type BusinessDocumentRow = {
  id: string
  business_id: string
  title: string
  doc_type: string
  file_url: string
  status: string
  uploaded_by: string | null
  review_note: string | null
  created_at: string
  updated_at: string
}

export async function GET(request: NextRequest) {
  try {
    const principal = await requireAdmin()

    if (!principal.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!principal.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending_review'

    let query = principal.supabase
      .from('business_documents')
      .select('*, business_profiles(name, slug)')
      .order('created_at', { ascending: false })

    if (status && ALLOWED_STATUSES.includes(status)) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []) as (BusinessDocumentRow & { business_profiles?: { name: string | null; slug: string | null } | null })[]

    const withSignedUrls = await Promise.all(
      rows.map(async (row) => {
        const { data: signed } = await principal.supabase.storage
          .from('business-documents')
          .createSignedUrl(row.file_url, 60 * 60)
        return { ...row, file_url: signed?.signedUrl ?? row.file_url }
      }),
    )

    return NextResponse.json(withSignedUrls)
  } catch (error) {
    console.error('Error fetching admin business documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const principal = await requireAdmin()

    if (!principal.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!principal.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, review_note } = body as {
      id?: string
      status?: string
      review_note?: string | null
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
    }

    const update: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (review_note !== undefined) update.review_note = review_note

    const { data, error } = await principal.supabase
      .from('business_documents')
      .update(update)
      .eq('id', id)
      .select()
      .single<BusinessDocumentRow>()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating business document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
