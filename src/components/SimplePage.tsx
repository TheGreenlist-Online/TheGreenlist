import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { LimitationsPanel } from '@/components/record'

type SimplePageProps = {
  title: string
  subtitle: string
  eyebrow?: string
  /** Optional document identifier shown in the header meta, e.g. GL-DOC-HELP. */
  documentId?: string
  sections: {
    heading: string
    body: string
  }[]
}

/**
 * Short reference document: reading width, headed sections, and the standard
 * limitations panel. Used for help, disclosures, and other plain-text pages so
 * they do not each invent their own layout.
 */
export function SimplePage({ title, subtitle, sections, eyebrow = 'Reference', documentId }: SimplePageProps) {
  return (
    <PageShell width="reading">
      <PageIntro
        eyebrow={eyebrow}
        title={title}
        lede={subtitle}
        meta={
          documentId ? (
            <span>
              <strong>Document</strong> {documentId}
            </span>
          ) : undefined
        }
      />

      <article className="gl-prose mt-2">
        {sections.map((section) => (
          <section key={section.heading} className="mt-8 first:mt-0">
            <h2 className="greenlist-section-title">{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </article>

      <LimitationsPanel subject="generic" />
    </PageShell>
  )
}
