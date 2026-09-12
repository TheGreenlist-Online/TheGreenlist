import Link from 'next/link'
import { Search } from 'lucide-react'
import { OrnatePanel } from '@/components/OrnatePanel'
import { PageIntro } from '@/components/PageIntro'
import { PageShell } from '@/components/PageShell'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Search - The Green List',
  description: 'Search public Green List businesses, discussions, news, and education resources.',
}

type SearchResult = {
  entity_type: 'business' | 'forum_thread' | 'news' | 'education'
  entity_id: string
  title: string
  summary: string | null
  href: string
  published_at: string
  rank: number
}

const labels: Record<SearchResult['entity_type'], string> = {
  business: 'Business',
  forum_thread: 'Forum',
  news: 'News',
  education: 'Education',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const params = await searchParams
  const query = (params.q ?? '').trim()
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)
  const pageSize = 20
  let results: SearchResult[] = []
  let loadError = false

  if (query.length >= 2) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.rpc('search_public_content', {
      search_text: query,
      result_limit: pageSize + 1,
      result_offset: (page - 1) * pageSize,
    })
    results = ((data ?? []) as SearchResult[])
    loadError = Boolean(error)
  }

  const hasNext = results.length > pageSize
  const visibleResults = results.slice(0, pageSize)
  const pageHref = (nextPage: number) =>
    `/search?q=${encodeURIComponent(query)}&page=${nextPage}`

  return (
    <PageShell>
      <PageIntro
        title="Search The Green List"
        lede="Find public businesses, forum discussions, news, and educational resources from one place."
      />

      <OrnatePanel className="mt-8">
        <form action="/search" method="get" className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="site-search">Search</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/70" />
            <input
              id="site-search"
              name="q"
              type="search"
              defaultValue={query}
              minLength={2}
              placeholder="Search businesses, forums, news..."
              className="h-11 w-full rounded-lg border border-white/10 bg-white/[.035] pl-11 pr-4 text-sm text-zinc-100 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
            />
          </div>
          <button type="submit" className="greenlist-primary-button">Search</button>
        </form>
      </OrnatePanel>

      {query.length < 2 ? (
        <OrnatePanel className="mt-6">
          <p className="text-sm text-zinc-400">Enter at least two characters to search.</p>
        </OrnatePanel>
      ) : loadError ? (
        <OrnatePanel className="mt-6">
          <p role="alert" className="text-sm text-red-300">Search could not be loaded. Please try again.</p>
        </OrnatePanel>
      ) : visibleResults.length === 0 ? (
        <OrnatePanel className="mt-6">
          <p className="font-semibold text-zinc-100">No public results found for “{query}”.</p>
        </OrnatePanel>
      ) : (
        <section className="mt-8 space-y-4" aria-label="Search results">
          <p className="text-sm text-zinc-400">Results for “{query}”</p>
          {visibleResults.map((result) => (
            <Link key={`${result.entity_type}:${result.entity_id}`} href={result.href} className="block">
              <OrnatePanel className="transition hover:-translate-y-0.5 hover:border-emerald-300/35">
                <p className="greenlist-eyebrow">{labels[result.entity_type]}</p>
                <h2 className="greenlist-card-title mt-1">{result.title}</h2>
                {result.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{result.summary}</p>
                ) : null}
              </OrnatePanel>
            </Link>
          ))}
          <nav className="flex items-center justify-between pt-4" aria-label="Search result pages">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="text-sm font-semibold text-emerald-300 hover:underline">
                ← Previous
              </Link>
            ) : <span />}
            {hasNext ? (
              <Link href={pageHref(page + 1)} className="text-sm font-semibold text-emerald-300 hover:underline">
                Next →
              </Link>
            ) : null}
          </nav>
        </section>
      )}
    </PageShell>
  )
}
