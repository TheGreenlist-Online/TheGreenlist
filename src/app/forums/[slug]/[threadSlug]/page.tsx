import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Lock, Pin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ThreadReplyForm } from './thread-reply-form'

export const revalidate = 0

type ForumRow = {
  id: string
  slug: string
  name: string
}

type ThreadRow = {
  id: string
  forum_id: string
  author_id: string | null
  title: string
  slug: string
  body: string
  is_anonymous: boolean
  is_pinned: boolean
  is_locked: boolean
  created_at: string
}

type ReplyRow = {
  id: string
  thread_id: string
  author_id: string | null
  parent_post_id: string | null
  body: string
  is_anonymous: boolean
  created_at: string
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; threadSlug: string }> }) {
  const { threadSlug } = await params
  return { title: `${threadSlug.replace(/-/g, ' ')} - The Green List` }
}

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ slug: string; threadSlug: string }>
}) {
  const { slug, threadSlug } = await params
  const supabase = await createSupabaseServerClient()

  const { data: forum } = await supabase
    .from('forums')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle<ForumRow>()

  if (!forum) notFound()

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('id, forum_id, author_id, title, slug, body, is_anonymous, is_pinned, is_locked, created_at')
    .eq('forum_id', forum.id)
    .eq('slug', threadSlug)
    .maybeSingle<ThreadRow>()

  if (!thread) notFound()

  const { data: replies } = await supabase
    .from('forum_posts')
    .select('id, thread_id, author_id, parent_post_id, body, is_anonymous, created_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })
    .returns<ReplyRow[]>()

  const allAuthorIds = new Set<string>()
  if (thread.author_id && !thread.is_anonymous) allAuthorIds.add(thread.author_id)
  for (const reply of replies ?? []) {
    if (reply.author_id && !reply.is_anonymous) allAuthorIds.add(reply.author_id)
  }

  const authorNames = new Map<string, string>()
  if (allAuthorIds.size) {
    const { data: authorProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', Array.from(allAuthorIds))
    for (const p of authorProfiles ?? []) {
      if (p.display_name) authorNames.set(p.id, p.display_name)
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  function authorLabel(authorId: string | null, isAnon: boolean) {
    if (isAnon) return 'Anonymous'
    if (authorId && authorNames.get(authorId)) return authorNames.get(authorId) as string
    return 'Member'
  }

  const topLevelReplies = (replies ?? []).filter((r) => !r.parent_post_id)
  const repliesByParent = new Map<string, ReplyRow[]>()
  for (const reply of replies ?? []) {
    if (reply.parent_post_id) {
      if (!repliesByParent.has(reply.parent_post_id)) repliesByParent.set(reply.parent_post_id, [])
      repliesByParent.get(reply.parent_post_id)!.push(reply)
    }
  }

  const callbackUrl = `/forums/${forum.slug}/${thread.slug}`

  return (
    <PageShell>
      <OrnatePanel className="district-page-intro">
        <div className="flex flex-wrap items-center gap-2">
          {thread.is_pinned ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          ) : null}
          {thread.is_locked ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2 py-0.5 text-xs font-semibold text-zinc-300">
              <Lock className="h-3 w-3" /> Locked
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-100 md:text-5xl">{thread.title}</h1>
        <p className="mt-3 text-sm text-zinc-500">
          by {authorLabel(thread.author_id, thread.is_anonymous)} ·{' '}
          {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })} · in{' '}
          <Link href={`/forums/${forum.slug}`} className="text-emerald-300 hover:underline">
            {forum.name}
          </Link>
        </p>
        <p className="mt-6 max-w-3xl whitespace-pre-wrap leading-7 text-zinc-300">{thread.body}</p>
      </OrnatePanel>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
          {(replies ?? []).length} {replies && replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        <div className="mt-4 space-y-4">
          {topLevelReplies.length === 0 ? (
            <OrnatePanel>
              <p className="text-sm text-zinc-400">No replies yet. Be the first to respond.</p>
            </OrnatePanel>
          ) : (
            topLevelReplies.map((reply) => (
              <div key={reply.id} className="space-y-3">
                <OrnatePanel>
                  <p className="text-sm text-zinc-500">
                    {authorLabel(reply.author_id, reply.is_anonymous)} ·{' '}
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{reply.body}</p>
                </OrnatePanel>
                {(repliesByParent.get(reply.id) ?? []).length > 0 ? (
                  <div className="ml-6 space-y-3 border-l border-emerald-300/15 pl-4">
                    {(repliesByParent.get(reply.id) ?? []).map((nested) => (
                      <OrnatePanel key={nested.id}>
                        <p className="text-sm text-zinc-500">
                          {authorLabel(nested.author_id, nested.is_anonymous)} ·{' '}
                          {formatDistanceToNow(new Date(nested.created_at), { addSuffix: true })}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{nested.body}</p>
                      </OrnatePanel>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <OrnatePanel>
          {thread.is_locked ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Lock className="h-4 w-4" />
              This thread is locked. New replies are not being accepted.
            </div>
          ) : (
            <ThreadReplyForm
              threadId={thread.id}
              isSignedIn={Boolean(user)}
              signInHref={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            />
          )}
        </OrnatePanel>
      </section>

      <div className="mt-10">
        <Link href={`/forums/${forum.slug}`} className="text-sm font-semibold text-emerald-300 hover:underline">
          ← Back to {forum.name}
        </Link>
      </div>
    </PageShell>
  )
}
