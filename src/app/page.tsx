import Link from 'next/link'
import { FileText, ShieldCheck, Users, BookOpen, FolderSearch, Map } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { FeatureCard } from '@/components/FeatureCard'
import { TrustBadge } from '@/components/TrustBadge'
import { Button } from '@/components/ui/button'

const features = [
  {
    title: 'Enter Green List Town',
    description: 'Explore the same trusted platform as a living digital town where every building opens a real community feature.',
    href: '/town',
    icon: <Map className="h-5 w-5" />,
  },
  {
    title: 'Reports',
    description: 'Document incidents, upload supporting evidence, and track status through accountable review workflows.',
    href: '/reports',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: 'Verified Businesses',
    description: 'Trust-first business profiles centered on verification, transparency history, and community reputation.',
    href: '/businesses',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: 'Forums',
    description: 'Serious community discussions on safety, accountability, education, and lived cannabis experiences.',
    href: '/forums',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'Education',
    description: 'Submit and review policy context, consumer safety guidance, and transparent public-interest education resources.',
    href: '/education/new',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: 'Evidence Submission',
    description: 'Structured upload and documentation pathways for records, screenshots, and supporting materials.',
    href: '/evidence/upload',
    icon: <FolderSearch className="h-5 w-5" />,
  },
]

export default function HomePage() {
  return (
    <PageShell>
      <section>
        <OrnatePanel>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Cannabis Transparency and Accountability</p>
          <h1 className="mt-3 text-4xl text-amber-100 sm:text-6xl">The Green List</h1>
          <p className="mt-4 max-w-3xl text-zinc-300 sm:text-lg">
            A trust-focused platform for reports, verified business reputation, community forums, and evidence-led public oversight.
            One source of truth, available through both the standard site and an immersive digital town. No marketplace. No ordering. No cannabis sales.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/town">Enter Green List Town</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/forums">Explore Standard Site</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/reports">View Reports</Link>
            </Button>
          </div>
        </OrnatePanel>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <section className="mt-10 flex justify-center">
        <TrustBadge />
      </section>
    </PageShell>
  )
}
