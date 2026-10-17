import Link from 'next/link'
import type { Metadata } from 'next'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { GlobalSearch } from '@/components/shell/GlobalSearch'
import { GOVERNANCE_LINKS, PRIMARY_NAV } from '@/config/navigation'

export const metadata: Metadata = {
  title: 'The Green List — Cannabis Records & Accountability',
}

const primaryActions = [
  {
    title: 'Search records',
    body: 'Look up a business, licence, report, or jurisdiction and see what is documented, what is missing, and where each fact came from.',
    href: '/businesses',
    cta: 'Open records',
  },
  {
    title: 'Read reports',
    body: 'Structured accountability reports with a visible review status. Allegations are labelled as allegations until a finding is published.',
    href: '/reports',
    cta: 'Open reports',
  },
  {
    title: 'Submit evidence or request a correction',
    body: 'Provide documents through a private-by-default intake, or dispute a published record with primary documentation.',
    href: '/evidence/upload',
    cta: 'Open intake',
  },
] as const

const statusVocabulary = [
  { tone: 'confirmed', label: 'Official source confirmed', meaning: 'A government or regulator source directly supports the stated fact.' },
  { tone: 'confirmed', label: 'Primary document verified', meaning: 'A source document was reviewed and linked to the listed record.' },
  { tone: 'neutral', label: 'Business-reported', meaning: 'The business submitted the information. It has not been independently confirmed.' },
  { tone: 'review', label: 'Partially documented', meaning: 'Some relevant evidence exists, but meaningful documentation is missing.' },
  { tone: 'review', label: 'Under review', meaning: 'The information is being assessed. No public conclusion is implied.' },
  { tone: 'alert', label: 'Official alert active', meaning: 'A source-linked regulator alert, recall, hold, or warning applies.' },
  { tone: 'neutral', label: 'Cannot verify', meaning: 'The platform cannot substantiate the claim using available evidence.' },
] as const

const cannotYetVerify = [
  'Batch-specific laboratory results for products sold at retail, until laboratory and regulator data feeds are connected.',
  'Whether a certificate of analysis represents the entire batch rather than the submitted sample.',
  'Ingredient and additive disclosures that manufacturers have not published.',
  'License status in real time. Records carry the date they were last checked against the official source.',
] as const

export default function HomePage() {
  return (
    <PageShell className="greenlist-home">
      {/* Statement of purpose */}
      <section aria-labelledby="home-heading" className="border-b border-[var(--gl-border)] pb-10">
        <p className="greenlist-eyebrow">Independent public-interest records</p>
        <h1 id="home-heading" className="greenlist-hero-title max-w-4xl">
          What is documented. What is missing. What needs accountability.
        </h1>
        <p className="greenlist-page-lede max-w-3xl text-[1.05rem]">
          The Green List is an independent records platform for the cannabis market. It makes business, licence,
          testing, and compliance information readable, comparable, and checkable against its sources — and it says
          plainly when something cannot be verified.
        </p>

        <div className="mt-8 max-w-3xl">
          <GlobalSearch placeholder="Business, licence, brand, report, or jurisdiction" />
          <p className="gl-meta mt-2">
            <span>Public records only.</span>
            <span>Private reports and evidence never appear in search.</span>
          </p>
        </div>

        <ul className="gl-meta mt-6 gap-x-6" aria-label="Platform commitments">
          <li>No paid verification</li>
          <li>No paid removal</li>
          <li>No hidden sponsorship</li>
          <li>No marketplace</li>
        </ul>
      </section>

      {/* Three primary actions */}
      <section className="gl-section" aria-labelledby="actions-heading">
        <div className="gl-section__head">
          <h2 id="actions-heading">Start here</h2>
          <p>Three ways to use the record.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {primaryActions.map((action) => (
            <OrnatePanel key={action.href} className="flex flex-col" innerClassName="flex h-full flex-col">
              <h3 className="greenlist-card-title">{action.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--gl-text-secondary)]">{action.body}</p>
              <Link href={action.href} className="greenlist-secondary-button mt-5 self-start">
                {action.cta}
              </Link>
            </OrnatePanel>
          ))}
        </div>
      </section>

      {/* What we can and cannot verify */}
      <section className="gl-section" aria-labelledby="scope-heading">
        <div className="gl-section__head">
          <h2 id="scope-heading">What the record can and cannot establish</h2>
          <p>Stated limits are part of the record, not a footnote to it.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="gl-panel">
            <div className="gl-panel__head">
              <h3>Status vocabulary</h3>
              <span className="gl-meta">Used identically on every record</span>
            </div>
            <table className="gl-ledger">
              <tbody>
                {statusVocabulary.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">
                      <span className={`gl-status gl-status--${row.tone}`}>{row.label}</span>
                    </th>
                    <td className="text-[var(--gl-text-secondary)]">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4">
            <div className="gl-panel">
              <div className="gl-panel__head">
                <h3>What The Green List cannot yet verify</h3>
              </div>
              <div className="gl-panel__body">
                <ul className="grid gap-3 text-sm leading-6 text-[var(--gl-text-secondary)]">
                  {cannotYetVerify.map((item) => (
                    <li key={item} className="border-l-2 border-[var(--gl-border-strong)] pl-3">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-[var(--gl-text-muted)]">
                  These gaps are the reason the platform exists. Closing them is the work, and progress is reported as
                  records — not as marketing.
                </p>
              </div>
            </div>

            <div className="gl-panel">
              <div className="gl-panel__head">
                <h3>What a record does not mean</h3>
              </div>
              <div className="gl-panel__body text-sm leading-6 text-[var(--gl-text-secondary)]">
                <p>
                  A record on The Green List is not a certification, an endorsement, a safety rating, or a
                  recommendation to purchase. A verification label states exactly what was checked, against which
                  source, and when. Nothing more is implied.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="gl-section" aria-labelledby="sections-heading">
        <div className="gl-section__head">
          <h2 id="sections-heading">Sections of the record</h2>
          <p>Every section uses the same shell, the same status language, and the same correction path.</p>
        </div>
        <div className="gl-panel">
          <table className="gl-ledger">
            <tbody>
              {PRIMARY_NAV.map((item) => (
                <tr key={item.href}>
                  <th scope="row">
                    <Link href={item.href} className="text-[var(--gl-text)] normal-case tracking-normal font-sans text-sm font-semibold hover:underline">
                      {item.label}
                    </Link>
                  </th>
                  <td className="text-[var(--gl-text-secondary)]">{item.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Governance */}
      <section className="gl-section" aria-labelledby="governance-heading">
        <div className="gl-section__head">
          <h2 id="governance-heading">How the work is governed</h2>
          <p>Published, permanent, and reachable from every page.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {GOVERNANCE_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="gl-panel gl-panel__body block transition-colors hover:border-[var(--gl-border-strong)]">
              <h3 className="greenlist-card-title">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--gl-text-secondary)]">{item.purpose}</p>
            </Link>
          ))}
        </div>

        <p className="gl-limitations mt-8 max-w-3xl">
          <strong>Public participation.</strong> The Evidence Desk exists to locate primary documents, identify missing
          records, ask informed questions, and correct errors. It is not a reputation vote, and discussion never
          changes a record&apos;s status without documentary review.
        </p>
      </section>
    </PageShell>
  )
}
