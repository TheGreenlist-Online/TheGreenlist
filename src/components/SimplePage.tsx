import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { FeatureCard } from '@/components/FeatureCard'
import { OrnatePanel } from '@/components/OrnatePanel'
import { TrustBadge } from '@/components/TrustBadge'
import { DistrictLabel } from '@/components/DistrictLabel'

type SimplePageProps = {
  title: string
  subtitle: string
  eyebrow?: string
  sections: {
    heading: string
    body: string
  }[]
}

export function SimplePage({ title, subtitle, sections, eyebrow }: SimplePageProps) {
  return (
    <PageShell>
      <OrnatePanel className="district-page-intro">
        <DistrictLabel override={eyebrow} />
        <h1 className="mt-3 text-4xl font-semibold text-zinc-100 md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-zinc-400">{subtitle}</p>
      </OrnatePanel>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <FeatureCard key={section.heading} title={section.heading} description={section.body} />
        ))}
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-sm font-semibold text-brand-lime hover:underline">
          Back to homepage
        </Link>
        <TrustBadge />
      </div>
    </PageShell>
  )
}
