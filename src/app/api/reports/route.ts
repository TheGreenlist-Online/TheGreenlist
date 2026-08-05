import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const REPORT_TYPES = new Set([
  'mislabeling',
  'contamination',
  'licensing',
  'worker_safety',
  'deceptive_marketing',
  'other',
])

type ReportListRow = {
  id: string
  title: string
  status: string
  report_type: string
  location_state: string | null
  location_city: string | null
  created_at: string
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, title, status, report_type, location_state, location_city, created_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .returns<ReportListRow[]>()

    if (error) throw error

    return NextResponse.json({ reports: reports ?? [] })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      report_type,
      title,
      description,
      location_state,
      location_city,
      is_anonymous,
      business_id,
    } = body ?? {}

    if (typeof report_type !== 'string' || !REPORT_TYPES.has(report_type)) {
      return NextResponse.json({ error: 'A valid report_type is required.' }, { status: 400 })
    }

    if (typeof title !== 'string' || title.trim().length < 8 || title.trim().length > 160) {
      return NextResponse.json(
        { error: 'Title must be between 8 and 160 characters.' },
        { status: 400 }
      )
    }

    if (typeof description !== 'string' || description.trim().length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters.' },
        { status: 400 }
      )
    }

    // Per the existing evidence-upload convention, reporter_id is always stored for
    // internal tracking even when the report is requested to be publicly anonymous.
    const insertPayload: Record<string, unknown> = {
      reporter_id: user.id,
      report_type,
      title: title.trim(),
      description: description.trim(),
      location_state: typeof location_state === 'string' && location_state.trim() ? location_state.trim() : null,
      location_city: typeof location_city === 'string' && location_city.trim() ? location_city.trim() : null,
      is_anonymous: Boolean(is_anonymous),
      status: 'submitted',
      verification_status: 'unverified',
    }

    if (typeof business_id === 'string' && business_id.trim()) {
      insertPayload.business_id = business_id.trim()
    }

    const { data: report, error } = await supabase
      .from('reports')
      .insert(insertPayload)
      .select('id')
      .single<{ id: string }>()

    if (error || !report) {
      throw error ?? new Error('The report could not be created.')
    }

    return NextResponse.json({ id: report.id }, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
