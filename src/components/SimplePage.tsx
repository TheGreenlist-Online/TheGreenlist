import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { FeatureCard } from '@/components/FeatureCard'
import { TrustBadge } from '@/components/TrustBadge'
import { PageIntro } from '@/components/PageIntro'

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
      <PageIntro eyebrow={eyebrow} title={title} lede={subtitle} />

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
