import Link from 'next/link'
import { Castle } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { TownGuidePanel } from '@/components/town/TownGuidePanel'
import { TownLocationIcon } from '@/components/town/TownLocationIcon'
import { TOWN_LOCATIONS } from '@/config/town-locations'

export const metadata = {
  title: 'Green List Town',
  description:
    'A living digital community where every building opens a real Green List feature. Same accounts, same records, same source of truth as the standard site.',
}

export default function TownPage() {
  return (
    <PageShell>
      <main className="relative overflow-hidden rounded-[2rem] border border-emerald-300/15 bg-black/45 px-4 py-8 shadow-2xl shadow-black/60 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(52,211,153,0.18),transparent_28rem),linear-gradient(180deg,rgba(1,8,5,0.12),rgba(1,5,3,0.92))]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 opacity-40 [background-image:linear-gradient(rgba(52,211,153,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.08)_1px,transparent_1px)] [background-size:48px_48px] [transform:perspective(500px)_rotateX(58deg)] [transform-origin:bottom]" />

        <section className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">One platform · Two ways to experience it</p>
          <h1 className="mt-4 text-5xl text-amber-100 sm:text-7xl">Welcome to Green List Town</h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
            A living digital community where every building opens a real Green List feature. The town and the standard site share the same accounts, records, permissions, forums, reports, and source of truth.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/auth/register">Become a Resident</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Use Standard View</Link>
            </Button>
          </div>
        </section>

        <TownGuidePanel />

        <section aria-labelledby="town-map-heading" className="relative z-10 mx-auto mt-14 max-w-6xl">
          <h2 id="town-map-heading" className="sr-only">
            Town map
          </h2>
          <ul className="grid gap-5 md:grid-cols-3 md:grid-rows-4">
            {TOWN_LOCATIONS.map((location) => {
              // The Town Square is this page; its card points at the guide rather than itself.
              const href = location.id === 'town-square' ? '#town-guide-heading' : location.townHref

              return (
                <li key={location.id} className={location.gridPosition}>
                  <Link
                    href={href}
                    className={`group relative flex h-full min-h-52 flex-col overflow-hidden rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/45 hover:shadow-[0_24px_70px_rgba(0,0,0,0.55)] ${
                      location.featured
                        ? 'border-amber-200/35 bg-gradient-to-b from-amber-100/10 to-emerald-950/65 md:min-h-64'
                        : 'border-emerald-200/15 bg-gradient-to-b from-emerald-900/20 to-black/75'
                    }`}
                  >
                    <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 [background:radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.16),transparent_70%)]" />
                    <div className="relative flex h-full flex-col">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-300/20 bg-black/35 text-emerald-300">
                        <TownLocationIcon icon={location.icon} className="h-6 w-6" />
                      </div>
                      <h3 className="mt-6 text-2xl text-amber-100">{location.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">{location.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                          {location.availability}
                        </span>
                        <span className="inline-flex rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          {location.district}
                        </span>
                      </div>
                      <span className="mt-auto pt-5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Enter location →
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="relative z-10 mx-auto mt-12 max-w-4xl rounded-2xl border border-amber-200/20 bg-black/45 p-6 text-center">
          <Castle className="mx-auto h-8 w-8 text-amber-200" />
          <h2 className="mt-3 text-3xl text-amber-100">Your Base Is Coming</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
            Every resident will have a privacy-first personal base for verified achievements, chosen public information, strain journals, saved places, community contributions, and role-specific trophies.
          </p>
        </section>
      </main>
    </PageShell>
  )
}
