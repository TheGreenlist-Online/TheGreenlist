'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Newspaper } from 'lucide-react'
import { OrnatePanel } from '@/components/OrnatePanel'
import { cn } from '@/lib/utils'

export type NewsRow = {
  id: string
  title: string
  summary: string | null
  source_name: string | null
  source_url: string | null
  category: string | null
  tags: string[] | null
  published_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  industry: 'Industry',
  policy: 'Policy',
  business: 'Business',
  culture: 'Culture',
}

function formatPublished(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return ''
  }
}

function NewsCard({ item }: { item: NewsRow }) {
  return (
    <OrnatePanel className="h-full" innerClassName="flex h-full flex-col">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {item.category ? (
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 font-semibold uppercase tracking-[0.1em] text-emerald-200">
            {CATEGORY_LABELS[item.category] ?? item.category}
          </span>
        ) : null}
        <span>{formatPublished(item.published_at)}</span>
      </div>

      <h3 className="greenlist-card-title mt-3">{item.title}</h3>

      {item.summary ? (
        <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">{item.summary}</p>
      ) : null}

      {item.tags && item.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[.04] px-2 py-0.5 text-[11px] text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {item.source_url ? (
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-4 inline-block text-sm font-semibold text-emerald-300 hover:underline"
        >
          {item.source_name ? `Read more at ${item.source_name}` : 'Read more'}
        </a>
      ) : null}
    </OrnatePanel>
  )
}

export function NewsFeed({
  initialItems,
  initialTotal,
}: {
  initialItems: NewsRow[]
  initialTotal: number
}) {
  const [category, setCategory] = useState<string>('all')
  const [items, setItems] = useState<NewsRow[]>(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isInitial = useRef(true)

  const availableCategories = useMemo(() => {
    const found = new Set<string>()
    initialItems.forEach((item) => {
      if (item.category) found.add(item.category)
    })
    return ['all', ...Array.from(found)]
  }, [initialItems])

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)

    fetch(`/api/news?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load news.')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setItems(data.items ?? [])
        setTotal(data.total ?? 0)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load news.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {availableCategories.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition',
              category === value
                ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-200'
                : 'border-white/10 bg-white/[.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200',
            )}
          >
            {CATEGORY_LABELS[value] ?? value}
          </button>
        ))}
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-300" /> : null}
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {items.length === 0 && !loading ? (
        <OrnatePanel className="mt-6">
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Newspaper className="h-8 w-8 text-emerald-300/60" />
            <p className="text-lg font-semibold text-zinc-200">No news yet. Check back soon.</p>
            <p className="max-w-md text-sm text-zinc-500">
              The automated news refresh runs every two hours and pulls the latest cannabis industry
              and policy headlines. Nothing has synced yet for this category.
            </p>
          </div>
        </OrnatePanel>
      ) : (
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </section>
      )}

      {items.length > 0 ? (
        <p className="mt-6 text-center text-xs text-zinc-500">
          Showing {items.length} of {total} update{total === 1 ? '' : 's'}.
        </p>
      ) : null}
    </div>
  )
}
