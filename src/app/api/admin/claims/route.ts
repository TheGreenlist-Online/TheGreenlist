import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/supabase/authz'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Business claim review.
 *
 * Decisions are written with the service role client, not the reviewer's own
 * session. `business_profiles` intentionally has no admin UPDATE policy, and
 * `protect_business_review_fields` discards verification changes that do not
 * come from a trusted context — so an admin-gated route using the service role
 * is the only path that can record a decision.
 *
 * Notifying the owner is handled by the `trg_business_profiles_notify_claim`
 * database trigger, so it happens for every write to verification_status
 * regardless of which code path made it.
 */

const DECISIONS = {
  approve: 'verified',
  deny: 'rejected',
} as const

type Decision = keyof typeof DECISIONS

function isDecision(value: unknown): value is Decision {
  return value === 'approve' || value === 'deny'
}

export async function GET() {
  const principal = await requirePermission('business.review')

  if (!principal.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!principal.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createSupabaseAdminClient()

  const { data, error } = await admin
    .from('business_profiles')
    .select(
      'id, name, slug, business_type, description, website_url, state, city, owner_id, verification_status, created_at',
    )
    .eq('is_claimed', true)
    .eq('verification_status', 'unverified')
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Failed to load claim queue:', error)
    return NextResponse.json({ error: 'Failed to load claim queue' }, { status: 500 })
  }

  return NextResponse.json({ claims: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  const principal = await requirePermission('business.review')

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

  const { id, decision, note } = (payload ?? {}) as {
    id?: unknown
    decision?: unknown
    note?: unknown
  }

  if (typeof id !== 'string' || !id.trim()) {
    return NextResponse.json({ error: 'A claim id is required' }, { status: 400 })
  }

  if (!isDecision(decision)) {
    return NextResponse.json(
      { error: "Decision must be 'approve' or 'deny'" },
      { status: 400 },
    )
  }

  if (note !== undefined && typeof note !== 'string') {
    return NextResponse.json({ error: 'Note must be text' }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()

  const { data: existing, error: lookupError } = await admin
    .from('business_profiles')
    .select('id, name, slug, owner_id, verification_status')
    .eq('id', id)
    .maybeSingle()

  if (lookupError) {
    console.error('Failed to load claim:', lookupError)
    return NextResponse.json({ error: 'Failed to load claim' }, { status: 500 })
  }

  if (!existing) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }

  // Two reviewers opening the queue at once should not both record a decision.
  if (existing.verification_status !== 'unverified') {
    return NextResponse.json(
      {
        error: `This claim was already ${existing.verification_status}.`,
        alreadyDecided: true,
      },
      { status: 409 },
    )
  }

  const nextStatus = DECISIONS[decision]

  const { data: updated, error: updateError } = await admin
    .from('business_profiles')
    .update({
      verification_status: nextStatus,
      // A denied claim should not stay listed as an active public profile.
      is_active: decision === 'approve',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('verification_status', 'unverified')
    .select('id, name, slug, verification_status')
    .maybeSingle()

  if (updateError) {
    console.error('Failed to record claim decision:', updateError)
    return NextResponse.json({ error: 'Failed to record decision' }, { status: 500 })
  }

  if (!updated) {
    return NextResponse.json(
      { error: 'This claim was decided by someone else.', alreadyDecided: true },
      { status: 409 },
    )
  }

  // Best effort: the decision itself is already committed, so a failure to
  // write the audit row must not fail the request.
  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: principal.user.id,
    action: decision === 'approve' ? 'business_claim.approved' : 'business_claim.denied',
    entity_type: 'business_profile',
    entity_id: id,
    metadata: {
      business_name: existing.name,
      owner_id: existing.owner_id,
      verification_status: nextStatus,
      ...(typeof note === 'string' && note.trim() ? { note: note.trim() } : {}),
    },
  })

  if (auditError) {
    console.error('Claim decision recorded but audit log failed:', auditError)
  }

  return NextResponse.json({ claim: updated, audited: !auditError })
}
