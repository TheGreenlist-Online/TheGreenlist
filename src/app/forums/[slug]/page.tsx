import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { LimitationsPanel, Notice, Pagination, Panel, RecordHeader, RecordList, RecordRow, Section, StatusLabel } from '@/components/record'
import { formatDate, humanize } from '@/lib/recordStatus'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { EVIDENCE_DESK_NAV_ITEM } from '@/config/navigation'

export const revalidate = 0

type ForumRow = {
  id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  accent_color: string | null
  is_active: boolean
}

type ThreadRow = {
  id: string
  slug: string
  title: string
  author_id: string | null
  is_anonymous: boolean
  is_pinned: boolean
  is_locked: boolean
  created_at: string
}

const PAGE_SIZE = 20

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return {
    title: `${slug.replace(/-/g, ' ')} - ${EVIDENCE_DESK_NAV_ITEM.label} - The Green List`,
  }
}

export default async function ForumDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  const supabase = await createSupabaseServerClient()

  const { data: forum } = await supabase
    .from('forums')
    .select('id, slug, name, description, category, accent_color, is_active')
    .eq('slug', slug)
    .maybeSingle<ForumRow>()

  if (!forum || !forum.is_active) {
    notFound()
  }

  const from = (page - 1) * PAGE_SIZE
  const { data: threads, count, error } = await supabase
    .from('forum_threads')
    .select('id, slug, title, author_id, is_anonymous, is_pinned, is_locked, created_at', { count: 'exact' })
    .eq('forum_id', forum.id)
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .returns<ThreadRow[]>()

  const authorIds = Array.from(
    new Set((threads ?? []).filter((t) => t.author_id && !t.is_anonymous).map((t) => t.author_id as string))
  )

  const authorNames = new Map<string, string>()
  if (authorIds.length) {
    const { data: authorProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds)
    for (const p of authorProfiles ?? []) {
      if (p.display_name) authorNames.set(p.id, p.display_name)
    }
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  return (
    <PageShell>
      <RecordHeader
        eyebrow={EVIDENCE_DESK_NAV_ITEM.label}
        kind="Discussion desk"
        jurisdiction={forum.category ? humanize(forum.category) : undefined}
        title={forum.name}
        lede={forum.description ?? 'Discussion in service of the record. Posts are moderated for sourcing.'}
        meta={[{ label: 'Discussions', value: String(count ?? 0) }]}
        actions={
          <>
            <Link href="/forums" className="greenlist-quiet-button">
              All desks
            </Link>
            <Link href={`/forums/new?forum=${forum.slug}`} className="greenlist-primary-button">
              New discussion
            </Link>
          </>
        }
      />

      <Section title="Discussions" aside={<><span>Pinned first</span><span>Then newest</span></>}>
        {error ? (
          <Notice tone="alert">Discussions could not be loaded. Try again shortly.</Notice>
        ) : !threads || threads.length === 0 ? (
          <Panel>
            <p className="text-sm font-semibold text-[var(--gl-text)]">No discussions open.</p>
            <p className="mt-1 text-sm leading-6 text-[var(--gl-text-secondary)]">No discussions have been opened in {forum.name}.</p>
          </Panel>
        ) : (
          <RecordList ariaLabel={`Discussions in ${forum.name}`}>
            {threads.map((thread) => {
              const authorLabel = thread.is_anonymous ? 'Anonymous' : (thread.author_id && authorNames.get(thread.author_id)) || 'Account holder'
              return (
                <RecordRow
                  key={thread.id}
                  href={`/forums/${forum.slug}/${thread.slug}`}
                  title={thread.title}
                  meta={
                    <>
                      <span>Opened {formatDate(thread.created_at)}</span>
                      <span>By {authorLabel}</span>
                    </>
                  }
                  aside={
                    thread.is_pinned || thread.is_locked ? (
                      <>
                        {thread.is_pinned ? <StatusLabel label="Pinned" tone="neutral" /> : null}
                        {thread.is_locked ? <StatusLabel label="Locked" tone="neutral" title="No further replies accepted" /> : null}
                      </>
                    ) : undefined
                  }
                />
              )
            })}
          </RecordList>
        )}
        <Pagination page={page} totalPages={totalPages} hrefFor={(p) => `/forums/${forum.slug}?page=${p}`} />
      </Section>

      <LimitationsPanel subject="discussion" />
    </PageShell>
  )
}
