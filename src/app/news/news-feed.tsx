'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Notice, Panel, RecordList, RecordRow, StatusLabel } from '@/components/record'
import { formatDate } from '@/lib/recordStatus'

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

function NewsItem({ item }: { item: NewsRow }) {
  return (
    <RecordRow
      title={
        item.source_url ? (
          <a href={item.source_url} target="_blank" rel="noopener noreferrer nofollow">
            {item.title}
          </a>
        ) : (
          item.title
        )
      }
      body={item.summary ?? undefined}
      meta={
        <>
          <span>{item.source_name ?? 'Outlet not recorded'}</span>
          <span>Published {formatDate(item.published_at)}</span>
          {item.category ? <span>{CATEGORY_LABELS[item.category] ?? item.category}</span> : null}
          {item.tags && item.tags.length ? <span>{item.tags.slice(0, 4).join(' · ')}</span> : null}
        </>
      }
      aside={<StatusLabel label="Outlet coverage" tone="neutral" title="Aggregated from a named outlet. Not a Green List finding." />}
    />
  )
}

export function NewsFeed({
  initialItems,
  initialTotal,
  initialError = null,
}: {
  initialItems: NewsRow[]
  initialTotal: number
  initialError?: string | null
}) {
  const [category, setCategory] = useState<string>('all')
  const [items, setItems] = useState<NewsRow[]>(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
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
      <Panel title="Filter by category" aside={loading ? <span>Loading…</span> : <span>{total} item{total === 1 ? '' : 's'}</span>}>
        <div className="flex flex-wrap items-center gap-2">
          {availableCategories.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={category === value ? 'greenlist-secondary-button' : 'greenlist-quiet-button'}
            >
              {CATEGORY_LABELS[value] ?? value}
            </button>
          ))}
        </div>
      </Panel>

      {error ? (
        <Notice tone="alert" className="mt-4">
          {error}
        </Notice>
      ) : null}

      {items.length === 0 && !loading && !error ? (
        <Panel className="mt-6">
          <p className="text-sm font-semibold text-[var(--gl-text)]">No items in this category.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--gl-text-secondary)]">
            The aggregation job runs every two hours and records industry, policy, enforcement, and recall coverage from named outlets. Nothing has been recorded for this category yet.
          </p>
        </Panel>
      ) : (
        <RecordList className="mt-6" ariaLabel="News items">
          {items.map((item) => (
            <NewsItem key={item.id} item={item} />
          ))}
        </RecordList>
      )}

      {items.length > 0 ? (
        <p className="gl-meta mt-4 justify-end">
          <span>
            Showing {items.length} of {total} item{total === 1 ? '' : 's'}
          </span>
        </p>
      ) : null}
    </div>
  )
}
