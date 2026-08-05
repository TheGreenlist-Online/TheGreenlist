import Link from 'next/link'
import { BadgeCheck, MapPin, Star } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentPrincipal } from '@/lib/supabase/authz'
import { isAdmin } from '@/lib/roles'

export const metadata = {
  title: 'Business Directory - The Green List',
  description: 'A public-facing directory of cannabis businesses with transparency and verification signals',
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
      <OrnatePanel className="district-page-intro">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">District services</p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-100 md:text-5xl">Business Directory</h1>
        <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
          A public-facing directory of cannabis businesses with accountability records, transparency signals, and
          consumer verification. Not a marketplace — this is a directory built for oversight.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/businesses/claim"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-300"
          >
            Claim a Business
          </Link>
        </div>
      </OrnatePanel>

      <OrnatePanel className="mt-8">
        <form method="get" className="grid gap-4 sm:grid-cols-4">
          <label className="block text-sm font-medium text-zinc-300 sm:col-span-2">
            Search
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name"
              className="mt-2 h-10 w-full rounded-md border border-accent/25 bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-300">
            State
            <select
              name="state"
              defaultValue={state ?? ''}
              className="mt-2 h-10 w-full rounded-md border border-accent/25 bg-background/70 px-3 text-sm text-foreground"
            >
              <option value="">All states</option>
              {uniqueStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-300">
            Business type
            <select
              name="business_type"
              defaultValue={businessType ?? ''}
              className="mt-2 h-10 w-full rounded-md border border-accent/25 bg-background/70 px-3 text-sm text-foreground"
            >
              <option value="">All types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {formatType(t)}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:border-emerald-300/60"
            >
              Apply filters
            </button>
          </div>
        </form>
      </OrnatePanel>

      {error ? (
        <OrnatePanel className="mt-8">
          <p className="text-sm text-red-300">The directory could not be loaded right now. Please try again shortly.</p>
        </OrnatePanel>
      ) : !businesses || businesses.length === 0 ? (
        <OrnatePanel className="mt-8">
          <p className="text-lg font-semibold text-zinc-100">No businesses yet</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {state || businessType || q
              ? 'No businesses match those filters. Try broadening your search.'
              : 'The business directory is empty right now.'}
          </p>
          <Link
            href="/businesses/claim"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:border-emerald-300/60"
          >
            Claim a business profile
          </Link>
          {viewerIsAdmin ? (
            <p className="mt-3 text-xs text-zinc-500">You are an admin — businesses claimed by owners will appear here automatically.</p>
          ) : null}
        </OrnatePanel>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {businesses.map((business) => (
            <Link key={business.id} href={`/businesses/${business.slug}`} className="block">
              <OrnatePanel className="h-full transition hover:-translate-y-0.5 hover:border-emerald-300/35">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-zinc-100">{business.name}</h2>
                  {business.verification_status === 'verified' ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  {formatType(business.business_type)}
                </p>
                {(business.city || business.state) ? (
                  <p className="mt-2 flex items-center gap-1 text-sm text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {[business.city, business.state].filter(Boolean).join(', ')}
                  </p>
                ) : null}
                {business.description ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">{business.description}</p>
                ) : null}
                <div className="mt-4 flex items-center gap-1 text-sm text-amber-300">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{(business.trust_rating ?? 0).toFixed(1)}</span>
                  <span className="text-zinc-500">trust score</span>
                </div>
              </OrnatePanel>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-between text-sm">
          <Link
            href={`/businesses?${buildQueryString({})}&page=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-emerald-300/25 px-4 py-2 font-semibold text-emerald-200 ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-emerald-300/60'}`}
          >
            ← Previous
          </Link>
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/businesses?${buildQueryString({})}&page=${Math.min(totalPages, page + 1)}`}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-emerald-300/25 px-4 py-2 font-semibold text-emerald-200 ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-emerald-300/60'}`}
          >
            Next →
          </Link>
        </div>
      ) : null}

      <div className="mt-10">
        <Link href="/" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to homepage
        </Link>
      </div>
    </PageShell>
  )
}
