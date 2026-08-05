import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type ReportDetailRow = {
  id: string
  reporter_id: string | null
  business_id: string | null
  forum_thread_id: string | null
  report_type: string
  title: string
  description: string
  location_state: string | null
  location_city: string | null
  is_anonymous: boolean
  status: string
  verification_status: string
  risk_level: string
  confidence_score: number
  public_summary: string | null
  created_at: string
  updated_at: string
}

// NOTE (phase 2 TODO): public visibility for resolved/substantiated reports via
// public_summary is not yet implemented here. For now this endpoint is gated to
// the owning reporter only. A future pass should allow unauthenticated or
// non-owner reads when status is 'resolved' or 'substantiated', returning only
// the public_summary + non-sensitive fields (never admin_notes).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: report, error } = await supabase
      .from('reports')
      .select(
        'id, reporter_id, business_id, forum_thread_id, report_type, title, description, location_state, location_city, is_anonymous, status, verification_status, risk_level, confidence_score, public_summary, created_at, updated_at'
      )
      .eq('id', id)
      .maybeSingle<ReportDetailRow>()

    if (error) throw error

    if (!report || report.reporter_id !== user.id) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
