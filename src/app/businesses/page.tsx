import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { LimitationsPanel, Notice, Pagination, Panel, RecordList, RecordRow, Section, StatusLabel } from '@/components/record'
import { recordId } from '@/lib/recordStatus'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentPrincipal } from '@/lib/supabase/authz'
import { isAdmin } from '@/lib/roles'
import { PageIntro } from '@/components/PageIntro'

export const metadata = {
  title: 'Business Records - The Green List',
  description: 'Business, licence, and documentation records with stated sources and verification status.',
}

export const revalidate = 0

type BusinessRow = {
  id: string
  slug: string
  name: string
  business_type: string | null
  description: string | null
  state: string | null
  city: string | null
  verification_status: string | null
  trust_rating: number | null
}

const PAGE_SIZE = 24

function formatType(type: string | null) {
  if (!type) return 'Business'
  return type.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; business_type?: string; q?: string; page?: string }>
}) {
  const { state, business_type: businessType, q, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('business_profiles')
    .select('id, slug, name, business_type, description, state, city, verification_status, trust_rating', {
      count: 'exact',
    })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (state) query = query.eq('state', state)
  if (businessType) query = query.eq('business_type', businessType)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: businesses, count, error } = await query.returns<BusinessRow[]>()

  const { data: states } = await supabase
    .from('business_profiles')
    .select('state')
    .eq('is_active', true)
    .not('state', 'is', null)

  const { data: types } = await supabase
    .from('business_profiles')
    .select('business_type')
    .eq('is_active', true)
    .not('business_type', 'is', null)

  const uniqueStates = Array.from(new Set((states ?? []).map((s) => s.state).filter(Boolean))) as string[]
  const uniqueTypes = Array.from(new Set((types ?? []).map((t) => t.business_type).filter(Boolean))) as string[]

  const { role, isPlatformOwner } = await getCurrentPrincipal()
  const viewerIsAdmin = isAdmin(role, isPlatformOwner)

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  function buildQueryString(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const next = { state, business_type: businessType, q, ...overrides }
    if (next.state) params.set('state', next.state)
    if (next.business_type) params.set('business_type', next.business_type)
    if (next.q) params.set('q', next.q)
    return params.toString()
  }

  return (
    <PageShell>
      <PageIntro
        title="Business Records"
        lede="Business, licence, and documentation records. Each record states what has been confirmed, against which source, and when — and what remains undocumented. A record is not an endorsement, and this is not a marketplace."
        meta={
          <>
            <span>{count ?? 0} active records</span>
            <span>Public records only</span>
          </>
        }
        actions={
          <Link href="/businesses/claim" className="greenlist-primary-button">
            Claim a record
          </Link>
        }
      />

      <Panel title="Filter records" aside="Filters narrow the list; they do not rank it" className="mt-8">
        <form method="get" className="grid gap-4 sm:grid-cols-4">
          <div className="gl-field sm:col-span-2">
            <label className="gl-label" htmlFor="q">
              Name
            </label>
            <input id="q" type="text" name="q" defaultValue={q} placeholder="Business name" className="gl-input" />
          </div>
          <div className="gl-field">
            <label className="gl-label" htmlFor="state">
              State
            </label>
            <select id="state" name="state" defaultValue={state ?? ''} className="gl-select">
              <option value="">All states</option>
              {uniqueStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="gl-field">
            <label className="gl-label" htmlFor="business_type">
              Business type
            </label>
            <select id="business_type" name="business_type" defaultValue={businessType ?? ''} className="gl-select">
              <option value="">All types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {formatType(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4 flex items-center gap-2">
            <button type="submit" className="greenlist-secondary-button">
              Apply filters
            </button>
            {state || businessType || q ? (
              <Link href="/businesses" className="greenlist-quiet-button">
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </Panel>

      <Section
        title="Records"
        aside={
          <>
            <span>Newest first</span>
            <span>Verification status shown per record</span>
          </>
        }
      >

        {error ? (
          <Notice tone="alert">Records could not be loaded. Try again shortly.</Notice>
        ) : !businesses || businesses.length === 0 ? (
          <Panel>
            <p className="text-sm font-semibold text-[var(--gl-text)]">No records match</p>
            <p className="mt-2 text-sm leading-6 text-[var(--gl-text-secondary)]">
              {state || businessType || q
                ? 'No business records match those filters. Broaden the search or clear the filters.'
                : 'No business records have been published yet.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/businesses/claim" className="greenlist-secondary-button">
                Claim a record
              </Link>
              <Link href="/evidence/upload" className="greenlist-quiet-button">
                Submit evidence
              </Link>
            </div>
            {viewerIsAdmin ? (
              <p className="mt-3 text-xs text-[var(--gl-text-muted)]">Reviewer note: records claimed by owners appear here once active.</p>
            ) : null}
          </Panel>
        ) : (
          <RecordList ariaLabel="Business records">
            {businesses.map((business) => (
              <RecordRow
                key={business.id}
                href={`/businesses/${business.slug}`}
                title={business.name}
                body={business.description ? business.description.slice(0, 180) + (business.description.length > 180 ? '…' : '') : undefined}
                meta={
                  <>
                    <span>{recordId('BUS', business.id)}</span>
                    <span>{formatType(business.business_type)}</span>
                    <span>{[business.city, business.state].filter(Boolean).join(', ') || 'Location not stated'}</span>
                  </>
                }
                aside={<StatusLabel value={business.verification_status} fallback={{ label: 'Not verified', tone: 'neutral' }} />}
              />
            ))}
          </RecordList>
        )}

        <Pagination page={page} totalPages={totalPages} hrefFor={(p) => `/businesses?${buildQueryString({})}&page=${p}`} />
      </Section>

      <LimitationsPanel subject="business" className="mt-10" />
    </PageShell>
  )
}
