import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/authz'

/**
 * verified_facts is moderator-curated content, NOT self-service.
 * Regular users cannot add facts to their own (or anyone else's) wall — this
 * prevents users from fabricating "verified" claims about themselves or
 * businesses. Only admins can create/verify facts (POST below is admin-only
 * via requireAdmin()). Anyone can read a subject's verified facts (GET).
 */

type VerifiedFactRow = {
  id: string
  subject_user_id: string | null
  subject_business_id: string | null
  fact_text: string
  category: string
  source_url: string | null
  verified_by: string | null
  verified_at: string
  created_at: string
  updated_at: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectUserId = searchParams.get('subject_user_id')
    const subjectBusinessId = searchParams.get('subject_business_id')

    if (!subjectUserId && !subjectBusinessId) {
      return NextResponse.json(
        { error: 'subject_user_id or subject_business_id is required' },
        { status: 400 },
      )
    }

    const supabase = await createSupabaseServerClient()

    let query = supabase
      .from('verified_facts')
      .select('*')
      .order('verified_at', { ascending: false })

    query = subjectUserId ? query.eq('subject_user_id', subjectUserId) : query.eq('subject_business_id', subjectBusinessId)

    const { data, error } = await query.returns<VerifiedFactRow[]>()
    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error fetching verified facts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await requireAdmin()

    if (!principal.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!principal.authorized) {
      return NextResponse.json({ error: 'Admin access required to add verified facts' }, { status: 403 })
    }

    const body = await request.json()
    const {
      fact_text,
      category,
      source_url,
      subject_user_id,
      subject_business_id,
    } = body as {
      fact_text?: string
      category?: string
      source_url?: string | null
      subject_user_id?: string | null
      subject_business_id?: string | null
    }

    if (!fact_text || typeof fact_text !== 'string' || fact_text.trim().length === 0) {
      return NextResponse.json({ error: 'fact_text is required' }, { status: 400 })
    }

    const hasUserSubject = Boolean(subject_user_id)
    const hasBusinessSubject = Boolean(subject_business_id)

    if (hasUserSubject === hasBusinessSubject) {
      return NextResponse.json(
        { error: 'Exactly one of subject_user_id or subject_business_id must be provided' },
        { status: 400 },
      )
    }

    const insertRow = {
      fact_text: fact_text.trim(),
      category: category?.trim() || 'general',
      source_url: source_url?.trim() || null,
      subject_user_id: subject_user_id || null,
      subject_business_id: subject_business_id || null,
      verified_by: principal.user.id,
      verified_at: new Date().toISOString(),
    }

    const { data, error } = await principal.supabase
      .from('verified_facts')
      .insert(insertRow)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating verified fact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
