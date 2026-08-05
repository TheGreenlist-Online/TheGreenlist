import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizePlatformRole, hasPermission } from '@/lib/roles'

const ALLOWED_DOC_TYPES = new Set(['license', 'lab_result', 'permit', 'other'])

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

async function getBusinessBySlug(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, slug: string) {
  const { data } = await supabase
    .from('business_profiles')
    .select('id, owner_id')
    .eq('slug', slug)
    .maybeSingle<{ id: string; owner_id: string | null }>()
  return data
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await createSupabaseServerClient()

    const business = await getBusinessBySlug(supabase, slug)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const {
      data: { user: requester },
    } = await supabase.auth.getUser()

    let isOwnerOrAdmin = false
    if (requester) {
      const isOwner = requester.id === business.owner_id
      let isAdmin = false
      if (!isOwner) {
        const { data: requesterProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', requester.id)
          .maybeSingle<{ role: string | null }>()
        const role = normalizePlatformRole(requesterProfile?.role)
        const isPlatformOwner = requester.app_metadata?.platform_owner === true
        isAdmin = hasPermission(role, 'platform:admin', isPlatformOwner)
      }
      isOwnerOrAdmin = isOwner || isAdmin
    }

    if (isOwnerOrAdmin) {
      const { data, error } = await supabase
        .from('business_documents')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .returns<BusinessDocumentRow[]>()

      if (error) throw error
      return NextResponse.json(data ?? [])
    }

    const { data, error } = await supabase
      .from('business_documents')
      .select('*')
      .eq('business_id', business.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .returns<BusinessDocumentRow[]>()

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error fetching business documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await getBusinessBySlug(supabase, slug)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the business owner can upload documents' }, { status: 403 })
    }

    const body = await request.json()
    const { title, doc_type, file_url } = body as {
      title?: string
      doc_type?: string
      file_url?: string
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    if (!file_url || typeof file_url !== 'string') {
      return NextResponse.json({ error: 'file_url is required' }, { status: 400 })
    }

    const normalizedDocType = ALLOWED_DOC_TYPES.has(doc_type ?? '') ? (doc_type as string) : 'other'

    const { data, error } = await supabase
      .from('business_documents')
      .insert({
        business_id: business.id,
        title: title.trim(),
        doc_type: normalizedDocType,
        file_url,
        status: 'pending_review',
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error uploading business document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
