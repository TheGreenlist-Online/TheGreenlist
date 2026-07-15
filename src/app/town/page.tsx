import Link from 'next/link'
import {
  Archive,
  BookOpen,
  Building2,
  Castle,
  Landmark,
  Newspaper,
  ShieldCheck,
  Trees,
  Users,
} from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'

const districts = [
  {
    name: 'Forum Hall',
    description: 'Enter the community commons for discussions, local rooms, questions, and public debate.',
    href: '/forums',
    icon: Users,
    position: 'md:col-start-2 md:row-start-1',
  },
  {
    name: 'Business District',
    description: 'Explore verified business properties, public records, responses, and transparency histories.',
    href: '/businesses',
    icon: Building2,
    position: 'md:col-start-1 md:row-start-2',
  },
  {
    name: 'Town Hall',
    description: 'The future home of platform proposals, governance records, policy discussions, and public decisions.',
    href: '/legal',
    icon: Landmark,
    position: 'md:col-start-2 md:row-start-2',
    featured: true,
  },
  {
    name: 'Transparency Archives',
    description: 'Review reports, evidence-led records, status histories, and resolved accountability matters.',
    href: '/reports',
    icon: Archive,
    position: 'md:col-start-3 md:row-start-2',
  },
  {
    name: 'Cultivator Grove',
    description: 'A future district for verified cultivator profiles, practices, facilities, education, and trust records.',
    href: '/businesses',
    icon: Trees,
    position: 'md:col-start-1 md:row-start-3',
  },
  {
    name: 'Knowledge Library',
    description: 'Find education, policy context, public-interest resources, and consumer protection guidance.',
    href: '/education/new',
    icon: BookOpen,
    position: 'md:col-start-2 md:row-start-3',
  },
  {
    name: 'Newsroom',
    description: 'Follow investigations, platform developments, cannabis-industry news, and public-interest reporting.',
    href: '/news',
    icon: Newspaper,
    position: 'md:col-start-3 md:row-start-3',
  },
  {
    name: 'The Watchtower',
    description: 'Transparent moderation, platform safety, review standards, appeals, and accountable oversight.',
    href: '/admin/moderation',
    icon: ShieldCheck,
    position: 'md:col-start-2 md:row-start-4',
  },
]

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

        <section className="relative z-10 mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3 md:grid-rows-4">
          {districts.map(({ name, description, href, icon: Icon, position, featured }) => (
            <Link
              key={name}
              href={href}
              className={`${position} group relative min-h-52 overflow-hidden rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/45 hover:shadow-[0_24px_70px_rgba(0,0,0,0.55)] ${
                featured
                  ? 'border-amber-200/35 bg-gradient-to-b from-amber-100/10 to-emerald-950/65 md:min-h-64'
                  : 'border-emerald-200/15 bg-gradient-to-b from-emerald-900/20 to-black/75'
              }`}
            >
              <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 [background:radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.16),transparent_70%)]" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-300/20 bg-black/35 text-emerald-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-6 text-2xl text-amber-100">{name}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{description}</p>
                <span className="mt-5 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Enter location →
                </span>
              </div>
            </Link>
          ))}
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
