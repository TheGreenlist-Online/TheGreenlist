import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Lock, MessageSquare, Pin, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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
    title: `${slug.replace(/-/g, ' ')} - Forums - The Green List`,
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
      <OrnatePanel className="district-page-intro">
        <p className="greenlist-eyebrow">
          {forum.category ? forum.category.replace(/[_-]+/g, ' ') : 'Forum'}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: forum.accent_color || '#34d399' }}
          />
          <h1 className="text-4xl font-semibold text-zinc-100 md:text-5xl">{forum.name}</h1>
        </div>
        {forum.description ? (
          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">{forum.description}</p>
        ) : null}
        <div className="mt-6">
          <Link
            href={`/forums/new?forum=${forum.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-300"
          >
            <Plus className="h-4 w-4" />
            New Thread
          </Link>
        </div>
      </OrnatePanel>

      {error ? (
        <OrnatePanel className="mt-8">
          <p className="text-sm text-red-300">Threads could not be loaded right now. Please try again shortly.</p>
        </OrnatePanel>
      ) : !threads || threads.length === 0 ? (
        <OrnatePanel className="mt-8">
          <p className="text-lg font-semibold text-zinc-100">No threads yet</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Be the first to start a discussion in {forum.name}.
          </p>
        </OrnatePanel>
      ) : (
        <div className="mt-8 space-y-4">
          {threads.map((thread) => {
            const authorLabel = thread.is_anonymous
              ? 'Anonymous'
              : (thread.author_id && authorNames.get(thread.author_id)) || 'Member'
            return (
              <Link key={thread.id} href={`/forums/${forum.slug}/${thread.slug}`} className="block">
                <OrnatePanel className="transition hover:-translate-y-0.5 hover:border-emerald-300/35">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
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
                      <h2 className="mt-2 truncate text-lg font-semibold text-zinc-100">{thread.title}</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        by {authorLabel} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <MessageSquare className="h-5 w-5 shrink-0 text-zinc-600" />
                  </div>
                </OrnatePanel>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-between text-sm">
          <Link
            href={`/forums/${forum.slug}?page=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-emerald-300/25 px-4 py-2 font-semibold text-emerald-200 ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-emerald-300/60'}`}
          >
            ← Previous
          </Link>
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/forums/${forum.slug}?page=${Math.min(totalPages, page + 1)}`}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-emerald-300/25 px-4 py-2 font-semibold text-emerald-200 ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-emerald-300/60'}`}
          >
            Next →
          </Link>
        </div>
      ) : null}

      <div className="mt-10">
        <Link href="/forums" className="text-sm font-semibold text-emerald-300 hover:underline">
          ← Back to all forums
        </Link>
      </div>
    </PageShell>
  )
}
