import { ReactNode } from 'react'
import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { GOVERNANCE_LINKS } from '@/config/navigation'

type GovernancePageProps = {
  title: string
  lede: string
  /** Document identifier shown in the file header, e.g. GL-METH-1.0. */
  documentId: string
  /** ISO date the document was last reviewed. */
  reviewed: string
  status?: 'Current' | 'Draft for comment'
  children: ReactNode
}

/**
 * Long-form governance document: methodology, sources, funding, corrections.
 * Reading width, document header, and a footer that links the sibling
 * documents so the governance set always travels together.
 */
export function GovernancePage({ title, lede, documentId, reviewed, status = 'Current', children }: GovernancePageProps) {
  const reviewedLabel = new Date(reviewed).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <PageShell width="reading">
      <PageIntro
        title={title}
        lede={lede}
        meta={
          <>
            <span>
              <strong>Document</strong> {documentId}
            </span>
            <span>
              <strong>Status</strong> {status}
            </span>
            <span>
              <strong>Last reviewed</strong> <time dateTime={reviewed}>{reviewedLabel}</time>
            </span>
          </>
        }
      />

      <article className="gl-prose mt-2">{children}</article>

      <nav aria-label="Governance documents" className="mt-12 border-t border-[var(--gl-border)] pt-6">
        <p className="greenlist-eyebrow">Governance documents</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {GOVERNANCE_LINKS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-[var(--gl-text-secondary)] hover:text-[var(--gl-text)] hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/about" className="text-[var(--gl-text-secondary)] hover:text-[var(--gl-text)] hover:underline">
              About The Green List
            </Link>
          </li>
        </ul>
      </nav>
    </PageShell>
  )
}
