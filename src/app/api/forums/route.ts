import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/authz'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: forums, error } = await supabase
      .from('forums')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(forums)
  } catch (error) {
    console.error('Error fetching forums:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await requireAdmin()

    if (!principal.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!principal.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, slug, category, color } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const { data: forum, error } = await principal.supabase
      .from('forums')
      .insert({
        name,
        description,
        slug,
        category,
        accent_color: color,
      })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(forum, { status: 201 })
  } catch (error) {
    console.error('Error creating forum:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
