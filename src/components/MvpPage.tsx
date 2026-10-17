import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { OrnatePanel } from '@/components/OrnatePanel'

/**
 * Placeholder page for sections whose records are not yet published. States
 * plainly what the section will hold; makes no claim about what exists today.
 */
export function MvpPage({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string
  title: string
  description: string
  items: string[]
}) {
  return (
    <PageShell>
      <PageIntro eyebrow={eyebrow} title={title} lede={description} />
      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Planned scope">
        {items.map((item) => (
          <OrnatePanel key={item}>
            <p className="text-sm leading-6 text-[var(--gl-text-secondary)]">{item}</p>
          </OrnatePanel>
        ))}
      </section>
      <p className="gl-limitations mt-8">
        <strong>Status:</strong> this section is not yet populated with reviewed records. Nothing on this page should be
        read as a finding about any business, product, or person.
      </p>
    </PageShell>
  )
}
