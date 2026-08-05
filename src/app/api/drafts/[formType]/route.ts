import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type DraftRow = {
  id: string
  user_id: string
  form_type: string
  payload: unknown
  created_at: string
  updated_at: string
}

// GET /api/drafts/[formType] — fetch the current user's autosaved draft for a
// given form_type. Returns { draft: null } (200) when none exists, so callers
// don't need to special-case 404s.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: draft, error } = await supabase
      .from('drafts')
      .select('id, user_id, form_type, payload, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('form_type', formType)
      .maybeSingle<DraftRow>()

    if (error) throw error

    return NextResponse.json({ draft: draft ?? null })
  } catch (error) {
    console.error('Error fetching draft:', error)
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 })
  }
}

// PUT /api/drafts/[formType] — upsert the current user's draft for this
// form_type. Body is stored verbatim as the JSON payload.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()

    const { data: draft, error } = await supabase
      .from('drafts')
      .upsert(
        {
          user_id: user.id,
          form_type: formType,
          payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,form_type' }
      )
      .select('id, user_id, form_type, payload, created_at, updated_at')
      .single<DraftRow>()

    if (error) throw error

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

// DELETE /api/drafts/[formType] — remove the current user's draft for this
// form_type. Call this after a successful form submission so stale drafts
// don't linger and get offered back to the user.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('form_type', formType)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting draft:', error)
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}
