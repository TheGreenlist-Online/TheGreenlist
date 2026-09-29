import { NextRequest, NextResponse } from 'next/server'
import { refreshNews } from '@/lib/jobs/refreshNews'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Scheduled entry point for the news refresh automation. Vercel Cron (see
 * vercel.json) calls this on a 2-hour schedule with the required bearer
 * token. Can also be triggered manually for testing with:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/refresh-news
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await refreshNews()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[api/cron/refresh-news] Job failed:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
