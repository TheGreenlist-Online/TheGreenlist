import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createPostSchema } from '@/utils/validators'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    const slug = `${validatedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${crypto.randomUUID().slice(0, 8)}`
    const { data: post, error } = await supabase
      .from('forum_threads')
      .insert({
        title: validatedData.title,
        body: validatedData.content,
        author_id: user.id,
        forum_id: validatedData.forumId,
        slug,
        status: 'published',
        visibility: 'public',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const forumId = searchParams.get('forumId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const from = (page - 1) * limit
    const supabase = await createSupabaseServerClient()
    let query = supabase
      .from('forum_threads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (forumId) query = query.eq('forum_id', forumId)
    const { data: posts, count: total, error } = await query
    if (error) throw error

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: total ?? 0,
        pages: Math.ceil((total ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
