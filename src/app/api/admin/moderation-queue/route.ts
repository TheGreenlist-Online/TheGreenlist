import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/authz'
import type { ModerationQueueRow } from '@/types/moderation'

const ALLOWED_STATUSES = ['pending', 'in_review', 'resolved']

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
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25))
    const from = (page - 1) * limit

    let query = principal.supabase
      .from('moderation_queue')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (status && ALLOWED_STATUSES.includes(status)) {
      query = query.eq('status', status)
    }

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({
      items: (data ?? []) as ModerationQueueRow[],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching moderation queue:', error)
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
    const { id, status, assigned_to, admin_notes } = body as {
      id?: string
      status?: string
      assigned_to?: string | null
      admin_notes?: string | null
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status !== undefined) update.status = status
    if (assigned_to !== undefined) update.assigned_to = assigned_to
    if (admin_notes !== undefined) update.admin_notes = admin_notes

    const { data, error } = await principal.supabase
      .from('moderation_queue')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await principal.supabase.from('audit_logs').insert({
      actor_id: principal.user.id,
      action: 'moderation_queue.update',
      target_type: 'moderation_queue',
      target_id: id,
      metadata: { status, assigned_to, admin_notes_changed: admin_notes !== undefined },
    })

    return NextResponse.json(data as ModerationQueueRow)
  } catch (error) {
    console.error('Error updating moderation queue item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
