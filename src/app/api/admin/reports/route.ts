import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/authz'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Report status review.
 *
 * `reports` has only `reports_update_owner` for UPDATE, so a reviewer's own
 * session cannot change another person's report. This route is admin-gated and
 * writes with the service role.
 *
 * The reporter is notified by the `trg_reports_notify_status_change` database
 * trigger — this route deliberately does not insert notifications itself, so
 * there is exactly one place that decides what a status-change notification
 * says.
 */

const STATUSES = [
  'submitted',
  'under_review',
  'needs_more_info',
  'published',
  'resolved',
  'rejected',
] as const

const VERIFICATION_STATUSES = [
  'unverified',
  'in_review',
  'verified',
  'substantiated',
  'disputed',
  'unsubstantiated',
] as const

export async function PATCH(request: NextRequest) {
  const principal = await requireAdmin()

  if (!principal.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!principal.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, status, verification_status, admin_notes } = (payload ?? {}) as {
    id?: unknown
    status?: unknown
    verification_status?: unknown
    admin_notes?: unknown
  }

  if (typeof id !== 'string' || !id.trim()) {
    return NextResponse.json({ error: 'A report id is required' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}

  if (status !== undefined) {
    if (typeof status !== 'string' || !STATUSES.includes(status as (typeof STATUSES)[number])) {
      return NextResponse.json(
        { error: `Status must be one of: ${STATUSES.join(', ')}` },
        { status: 400 },
      )
    }
    update.status = status
  }

  if (verification_status !== undefined) {
    if (
      typeof verification_status !== 'string' ||
      !VERIFICATION_STATUSES.includes(verification_status as (typeof VERIFICATION_STATUSES)[number])
    ) {
      return NextResponse.json(
        { error: `Verification status must be one of: ${VERIFICATION_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }
    update.verification_status = verification_status
  }

  if (admin_notes !== undefined) {
    if (typeof admin_notes !== 'string') {
      return NextResponse.json({ error: 'Notes must be text' }, { status: 400 })
    }
    update.admin_notes = admin_notes.trim() || null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()

  const { data: existing, error: lookupError } = await admin
    .from('reports')
    .select('id, title, status, verification_status')
    .eq('id', id)
    .maybeSingle()

  if (lookupError) {
    console.error('Failed to load report:', lookupError)
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 })
  }

  if (!existing) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  update.updated_at = new Date().toISOString()

  const { data: updated, error: updateError } = await admin
    .from('reports')
    .update(update)
    .eq('id', id)
    .select('id, title, status, verification_status')
    .maybeSingle()

  if (updateError) {
    console.error('Failed to update report:', updateError)
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }

  const statusChanged = 'status' in update && update.status !== existing.status
  const verificationChanged =
    'verification_status' in update && update.verification_status !== existing.verification_status

  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: principal.user.id,
    action: 'report.status_changed',
    entity_type: 'report',
    entity_id: id,
    metadata: {
      title: existing.title,
      from: { status: existing.status, verification_status: existing.verification_status },
      to: { status: updated?.status, verification_status: updated?.verification_status },
      ...(typeof admin_notes === 'string' && admin_notes.trim()
        ? { note: admin_notes.trim() }
        : {}),
    },
  })

  if (auditError) {
    console.error('Report updated but audit log failed:', auditError)
  }

  return NextResponse.json({
    report: updated,
    // True when the database trigger will have written a notification.
    notified: statusChanged || verificationChanged,
    audited: !auditError,
  })
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
