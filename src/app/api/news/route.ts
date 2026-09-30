import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

/**
 * Public read endpoint backing the /news page. Supports optional category
 * filtering and simple offset-based pagination.
 *
 *   GET /api/news
 *   GET /api/news?category=policy
 *   GET /api/news?page=2&pageSize=20
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category')?.trim() || null
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number.parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    )

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('news')
      .select('id, title, summary, source_name, source_url, category, tags, published_at', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(from, to)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
      hasMore: count != null ? from + (data?.length ?? 0) < count : false,
    })
  } catch (error) {
    console.error('[api/news] Failed to load news:', error)
    return NextResponse.json({ error: 'Failed to load news.' }, { status: 500 })
  }
}
