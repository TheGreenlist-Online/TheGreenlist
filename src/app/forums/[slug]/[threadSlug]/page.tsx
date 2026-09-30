import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { LimitationsPanel, Notice, Panel, RecordHeader, Section, StatusLabel } from '@/components/record'
import { formatDate, recordId } from '@/lib/recordStatus'
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
    return 'Account holder'
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

  const stamp = (value: string) => formatDate(value, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <PageShell width="record">
      <RecordHeader
        eyebrow="Evidence Desk"
        kind="Discussion"
        recordId={recordId('DSK', thread.id)}
        title={thread.title}
        meta={[
          { label: 'Opened', value: stamp(thread.created_at) },
          { label: 'By', value: authorLabel(thread.author_id, thread.is_anonymous) },
          { label: 'Desk', value: <Link href={`/forums/${forum.slug}`} className="gl-link">{forum.name}</Link> },
        ]}
        actions={
          <Link href={`/forums/${forum.slug}`} className="greenlist-quiet-button">
            Back to {forum.name}
          </Link>
        }
      >
        {thread.is_pinned || thread.is_locked ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {thread.is_pinned ? <StatusLabel label="Pinned" tone="neutral" /> : null}
            {thread.is_locked ? <StatusLabel label="Locked" tone="neutral" title="No further replies accepted" /> : null}
          </div>
        ) : null}
      </RecordHeader>

      <Panel title="Opening post" className="mt-8">
        <p className="gl-article">{thread.body}</p>
      </Panel>

      <Section title="Replies" aside={<span>{(replies ?? []).length} {replies && replies.length === 1 ? 'reply' : 'replies'}</span>}>
        {topLevelReplies.length === 0 ? (
          <Panel>
            <p className="text-sm text-[var(--gl-text-muted)]">No replies have been posted.</p>
          </Panel>
        ) : (
          <div className="grid gap-4">
            {topLevelReplies.map((reply) => (
              <div key={reply.id} className="grid gap-3">
                <Panel aside={<><span>{authorLabel(reply.author_id, reply.is_anonymous)}</span><span>{stamp(reply.created_at)}</span></>}>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--gl-text-secondary)]">{reply.body}</p>
                </Panel>
                {(repliesByParent.get(reply.id) ?? []).length > 0 ? (
                  <div className="ml-6 grid gap-3 border-l border-[var(--gl-border-strong)] pl-4">
                    {(repliesByParent.get(reply.id) ?? []).map((nested) => (
                      <Panel key={nested.id} aside={<><span>{authorLabel(nested.author_id, nested.is_anonymous)}</span><span>{stamp(nested.created_at)}</span></>}>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--gl-text-secondary)]">{nested.body}</p>
                      </Panel>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Add a reply" aside={<span>Cite a source where you can</span>}>
        {thread.is_locked ? (
          <Notice tone="info">This discussion is locked. New replies are not being accepted.</Notice>
        ) : (
          <Panel>
            <ThreadReplyForm threadId={thread.id} isSignedIn={Boolean(user)} signInHref={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} />
          </Panel>
        )}
      </Section>

      <LimitationsPanel subject="discussion" />
    </PageShell>
  )
}
