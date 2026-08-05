import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/authz'
import { refreshNews } from '@/lib/jobs/refreshNews'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Admin-only manual trigger for the news refresh job. Gated by
 * requireAdmin() rather than CRON_SECRET since it's already behind
 * authenticated admin access. Used by the "Run news refresh now" button on
 * /admin/news.
 */
export async function POST() {
  const principal = await requireAdmin()

  if (!principal.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!principal.authorized) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const result = await refreshNews()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[api/admin/run-news-refresh] Job failed:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
