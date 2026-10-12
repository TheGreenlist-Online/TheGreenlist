import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('thread_id')

    if (!threadId) {
      return NextResponse.json({ error: 'thread_id is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: replies, error } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ replies: replies ?? [] })
  } catch (error) {
    console.error('Error fetching forum posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    )
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
    const { thread_id, parent_post_id, body: replyBody, is_anonymous } = body

    if (!thread_id || typeof thread_id !== 'string') {
      return NextResponse.json({ error: 'thread_id is required' }, { status: 400 })
    }

    if (!replyBody || typeof replyBody !== 'string' || !replyBody.trim()) {
      return NextResponse.json({ error: 'Reply body is required' }, { status: 400 })
    }

    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('id, is_locked')
      .eq('id', thread_id)
      .maybeSingle()

    if (threadError) throw threadError
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }
    if (thread.is_locked) {
      return NextResponse.json({ error: 'This thread is locked and no longer accepting replies' }, { status: 403 })
    }

    const { data: reply, error } = await supabase
      .from('forum_posts')
      .insert({
        thread_id,
        parent_post_id: parent_post_id ?? null,
        author_id: user.id,
        body: replyBody.trim(),
        is_anonymous: Boolean(is_anonymous),
        status: 'published',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(reply, { status: 201 })
  } catch (error) {
    // The database is authoritative if a thread locks after the pre-check.
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if (error.code === '42501') {
        return NextResponse.json(
          { error: 'Replies require an accessible published and unlocked thread' },
          { status: 403 },
        )
      }
      if (error.code === '22001') {
        return NextResponse.json({ error: 'Reply is too long' }, { status: 400 })
      }
    }
    console.error('Error creating forum post:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
