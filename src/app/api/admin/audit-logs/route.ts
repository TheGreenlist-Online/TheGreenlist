import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/authz'
import type { AuditLogRow } from '@/types/moderation'

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25))
    const from = (page - 1) * limit

    const { data, count, error } = await principal.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error) throw error

    return NextResponse.json({
      items: (data ?? []) as AuditLogRow[],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
