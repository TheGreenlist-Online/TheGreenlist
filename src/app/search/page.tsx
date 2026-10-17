import Link from 'next/link'
import { PageIntro } from '@/components/PageIntro'
import { LimitationsPanel, Notice, Panel, RecordList, RecordRow, Section, StatusLabel } from '@/components/record'
import { formatDate } from '@/lib/recordStatus'
import { PageShell } from '@/components/PageShell'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Search - The Green List',
  description: 'Search public Green List records, reports, discussions, news, and explainers.',
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
  business: 'Business record',
  forum_thread: 'Discussion',
  news: 'Outlet coverage',
  education: 'Learn resource',
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
        title="Search records"
        lede="Search public business records, discussions, news coverage, and explainers. Private reports and evidence never appear in results."
        meta={
          <>
            <span>Public records only</span>
            <span>Ranked by text match, not by rating</span>
          </>
        }
      />

      <Panel className="mt-8">
        <form action="/search" method="get" className="flex flex-col gap-3 sm:flex-row">
          <div className="gl-field flex-1">
            <label className="gl-label" htmlFor="site-search">
              Search term
            </label>
            <input id="site-search" name="q" type="search" defaultValue={query} minLength={2} placeholder="Business, licence, report, jurisdiction" className="gl-input" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="greenlist-primary-button">
              Search
            </button>
          </div>
        </form>
      </Panel>

      <Section title={query.length >= 2 ? `Results for “${query}”` : 'Results'} aside={query.length >= 2 && !loadError ? <span>{visibleResults.length}{hasNext ? '+' : ''} shown</span> : undefined}>
        {query.length < 2 ? (
          <Notice tone="info">Enter at least two characters to search.</Notice>
        ) : loadError ? (
          <Notice tone="alert">Search could not be completed. Try again shortly.</Notice>
        ) : visibleResults.length === 0 ? (
          <Panel>
            <p className="text-sm font-semibold text-[var(--gl-text)]">No public records match “{query}”.</p>
            <p className="mt-1 text-sm leading-6 text-[var(--gl-text-secondary)]">
              Absence from search does not mean absence from the market. If a business or licence should be on record,{' '}
              <Link href="/evidence/upload" className="gl-link">
                submit evidence
              </Link>
              .
            </p>
          </Panel>
        ) : (
          <>
            <RecordList ariaLabel="Search results">
              {visibleResults.map((result) => (
                <RecordRow
                  key={`${result.entity_type}:${result.entity_id}`}
                  href={result.href}
                  title={result.title}
                  body={result.summary ?? undefined}
                  meta={
                    <>
                      <span>{labels[result.entity_type]}</span>
                      <span>{formatDate(result.published_at)}</span>
                    </>
                  }
                  aside={<StatusLabel label={labels[result.entity_type]} tone="neutral" />}
                />
              ))}
            </RecordList>
            <nav className="gl-pagination" aria-label="Search result pages">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="greenlist-quiet-button">
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="gl-meta">Page {page}</span>
              {hasNext ? (
                <Link href={pageHref(page + 1)} className="greenlist-quiet-button">
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </>
        )}
      </Section>

      <LimitationsPanel />
    </PageShell>
  )
}
