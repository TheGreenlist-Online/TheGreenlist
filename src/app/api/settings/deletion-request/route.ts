import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const MAX_REASON_LEN = 2000

/**
 * File an account-closure request.
 *
 * Deletion is deliberately not immediate and not self-service: reports and
 * evidence on this platform are accountability records that may be part of an
 * open review, so a human has to decide what can be removed and what must be
 * retained or anonymised. This opens a support ticket and tells the user so,
 * rather than offering a delete button that quietly does nothing.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as { reason?: string }
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, MAX_REASON_LEN) : ''

    // Don't stack duplicate requests if the user submits twice.
    const { data: existing } = await supabase
      .from('support_tickets')
      .select('id, created_at')
      .eq('profile_id', user.id)
      .eq('ticket_type', 'ACCOUNT_DELETION')
      .eq('status', 'open')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ status: 'already_open', ticket_id: existing.id, created_at: existing.created_at })
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        profile_id: user.id,
        email: user.email ?? null,
        ticket_type: 'ACCOUNT_DELETION',
        subject: 'Account closure request',
        message: reason
          ? `Account closure requested by the account holder.\n\nStated reason:\n${reason}`
          : 'Account closure requested by the account holder. No reason given.',
        priority: 'high',
      })
      .select('id, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ status: 'created', ticket_id: ticket.id, created_at: ticket.created_at })
  } catch (error) {
    console.error('Error filing account deletion request:', error)
    return NextResponse.json({ error: 'Failed to file the request' }, { status: 500 })
  }
}
