import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { FeatureCard } from '@/components/FeatureCard'
import { OrnatePanel } from '@/components/OrnatePanel'
import { TrustBadge } from '@/components/TrustBadge'

type SimplePageProps = {
  title: string
  subtitle: string
  sections: {
    heading: string
    body: string
  }[]
}

export function SimplePage({ title, subtitle, sections }: SimplePageProps) {
  return (
    <PageShell>
      <OrnatePanel>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">The Green List</p>
        <h1 className="mt-3 text-4xl text-amber-100">{title}</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">{subtitle}</p>
      </OrnatePanel>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <FeatureCard key={section.heading} title={section.heading} description={section.body} />
        ))}
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to homepage
        </Link>
        <TrustBadge />
      </div>
    </PageShell>
  )
}
