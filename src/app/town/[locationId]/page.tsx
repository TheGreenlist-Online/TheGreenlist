import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'
import type { Metadata } from 'next'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { TownLocationIcon } from '@/components/town/TownLocationIcon'
import { TOWN_LOCATIONS, getTownLocation } from '@/config/town-locations'

/**
 * Town location pages are a themed entrance to a real platform feature — they
 * never render platform records themselves. Every location links through to the
 * standard route, which is where authentication and RLS actually apply.
 */

type PageProps = { params: Promise<{ locationId: string }> }

export function generateStaticParams() {
  return TOWN_LOCATIONS.filter((location) => location.townHref !== '/town').map((location) => ({
    locationId: location.id,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locationId } = await params
  const location = getTownLocation(locationId)

  if (!location) return { title: 'Location not found · Green List Town' }

  return {
    title: `${location.name} · Green List Town`,
    description: location.description,
  }
}

const ACCESS_LABELS: Record<string, string> = {
  public: 'Open to everyone',
  authenticated: 'Residents only — sign in to continue',
  'role-restricted': 'Restricted to moderators and platform staff',
}

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Records here are public',
  private: 'Records here are private',
  mixed: 'Contains both public and restricted records',
}

export default async function TownLocationPage({ params }: PageProps) {
  const { locationId } = await params
  const location = getTownLocation(locationId)

  if (!location || location.townHref === '/town') notFound()

  const neighbours = TOWN_LOCATIONS.filter(
    (candidate) => candidate.district === location.district && candidate.id !== location.id,
  )

  return (
    <PageShell>
      <main className="relative overflow-hidden rounded-[2rem] border border-emerald-300/15 bg-black/45 px-4 py-8 shadow-2xl shadow-black/60 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(52,211,153,0.16),transparent_26rem),linear-gradient(180deg,rgba(1,8,5,0.12),rgba(1,5,3,0.92))]" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <Link
            href="/town"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to the town map
          </Link>

          <div className="mt-6 flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-950/50 text-emerald-300">
              <TownLocationIcon icon={location.icon} className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">{location.district}</p>
              <h1 className="mt-2 text-4xl text-amber-100 sm:text-5xl">{location.name}</h1>
              <p className="mt-1 text-sm text-zinc-400">{location.tagline}</p>
            </div>
          </div>

          <p className="mt-6 text-base leading-7 text-zinc-300">{location.description}</p>

          <ul className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider">
            <li className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">{location.availability}</li>
            <li className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">
              {ACCESS_LABELS[location.access]}
            </li>
            <li className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">
              {VISIBILITY_LABELS[location.visibility]}
            </li>
          </ul>

          {location.access === 'role-restricted' ? (
            <p className="mt-6 flex items-start gap-2 rounded-xl border border-amber-300/30 bg-amber-950/25 p-4 text-sm leading-6 text-amber-100">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              This location is role-protected. The link below leads to the real feature, which will refuse access unless
              your account holds the required role.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={location.standardHref}>Enter {location.name}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/town">Explore the town</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs leading-6 text-zinc-400">
            The town is an interface, not a separate system. Entering this location takes you to{' '}
            <code className="text-emerald-300">{location.standardHref}</code> — the same records, permissions and
            account you would see in the standard view.
          </p>

          {neighbours.length > 0 ? (
            <section aria-labelledby="neighbours-heading" className="mt-12">
              <h2 id="neighbours-heading" className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Also in {location.district}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {neighbours.map((neighbour) => (
                  <li key={neighbour.id}>
                    <Link
                      href={neighbour.townHref}
                      className="flex h-full flex-col rounded-xl border border-white/10 bg-black/40 p-4 transition hover:border-emerald-300/40"
                    >
                      <span className="text-sm font-semibold text-amber-100">{neighbour.name}</span>
                      <span className="mt-1 text-xs leading-5 text-zinc-300">{neighbour.tagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
    </PageShell>
  )
}
