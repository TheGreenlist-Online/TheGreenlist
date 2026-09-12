import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Download everything this account holds, as a JSON file.
 *
 * Every query runs under the caller's own session, so row-level security is
 * what scopes the export — there is no service key here and no way to widen it
 * to another user's rows. Private evidence bodies are not included; only the
 * file metadata the owner can already see.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [profile, reports, education, threads, tickets, notifications] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase
        .from('reports')
        .select('id, title, report_type, status, verification_status, location_city, location_state, is_anonymous, created_at, updated_at')
        .eq('reporter_id', user.id),
      supabase
        .from('education_resources')
        .select('id, title, category, status, summary, created_at, updated_at')
        .eq('submitter_id', user.id),
      supabase
        .from('forum_threads')
        .select('id, title, slug, status, is_anonymous, created_at, updated_at')
        .eq('author_id', user.id),
      supabase.from('support_tickets').select('id, ticket_type, subject, status, created_at').eq('profile_id', user.id),
      supabase.from('notifications').select('id, type, title, created_at, read_at').eq('profile_id', user.id),
    ])

    const payload = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email, created_at: user.created_at },
      profile: profile.data ?? null,
      reports: reports.data ?? [],
      education_resources: education.data ?? [],
      forum_threads: threads.data ?? [],
      support_tickets: tickets.data ?? [],
      notifications: notifications.data ?? [],
      note: 'Private evidence file contents are not included in this export. Contact support for an evidence copy.',
    }

    const stamp = new Date().toISOString().slice(0, 10)

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="greenlist-data-${stamp}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error exporting account data:', error)
    return NextResponse.json({ error: 'Failed to export account data' }, { status: 500 })
  }
}
