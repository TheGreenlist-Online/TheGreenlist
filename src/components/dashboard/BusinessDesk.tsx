import Link from 'next/link'
import { RecordList, RecordRow, StatusLabel, Notice } from '@/components/record'
import { StatTile } from '@/components/dashboard/StatTile'
import type { BusinessDesk as BusinessDeskData } from '@/lib/business-desk'

/**
 * The operator's view of the records they hold: verification state, the
 * document ledger, and findings that name the business. Four numbers, then
 * one row per record. No scores, no rankings, nothing purchasable.
 */
export function BusinessDesk({ desk }: { desk: BusinessDeskData }) {
  const { records, totals } = desk

  if (records.length === 0) {
    return (
      <section className="gl-panel" aria-labelledby="business-desk-title">
        <div className="gl-panel__head">
          <h2 id="business-desk-title">Your business records</h2>
        </div>
        <div className="gl-panel__body">
          <div className="border border-dashed border-[var(--gl-border)] p-5">
            <p className="text-sm font-semibold text-[var(--gl-text)]">No record claimed yet</p>
            <p className="mt-1.5 max-w-prose text-sm leading-6 text-[var(--gl-text-secondary)]">
              Claiming attaches your account to a business already on the record, or creates one if it is missing. A reviewer confirms you represent the
              business before anything is labelled verified. The claim is free and does not change what the public can read about the business.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/businesses/claim" className="greenlist-primary-button">
                Claim a record
              </Link>
              <Link href="/businesses" className="greenlist-quiet-button">
                Look up a business
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="business-desk-title" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="business-desk-title" className="text-base font-semibold text-[var(--gl-text)]">
          Your business records
        </h2>
        <Link href="/businesses/claim" className="gl-link text-xs">
          Claim another record
        </Link>
      </div>

      {desk.degraded ? (
        <Notice tone="review" role="status">
          Some record details could not be loaded. The counts below may be incomplete.
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Records held" value={totals.records} href="/businesses" note={totals.verified === totals.records ? 'All identity verified' : `${totals.verified} identity verified`} />
        <StatTile
          label="Documents awaiting review"
          value={totals.pendingDocuments}
          href={records[0] ? `/businesses/${records[0].slug}#documents` : '/businesses'}
          note={totals.pendingDocuments > 0 ? 'Licences, COAs, authorisations' : 'Nothing pending'}
          emphasis={totals.pendingDocuments > 0}
        />
        <StatTile
          label="Findings under review"
          value={totals.openFindings}
          href="/reports"
          note={totals.openFindings > 0 ? 'Right of reply is open' : 'None open'}
          emphasis={totals.openFindings > 0}
        />
        <StatTile
          label="Published findings"
          value={records.reduce((n, r) => n + r.findings.published, 0)}
          href="/reports"
          note="Naming a record you hold"
        />
      </div>

      <RecordList ariaLabel="Business records you hold">
        {records.map((r) => (
          <RecordRow
            key={r.id}
            href={`/businesses/${r.slug}`}
            title={r.name}
            body={[r.city, r.state].filter(Boolean).join(', ') || undefined}
            meta={
              <>
                <span>
                  Documents: {r.documents.approved} approved · {r.documents.pending} pending
                  {r.documents.rejected > 0 ? ` · ${r.documents.rejected} returned` : ''}
                </span>
                <span>
                  Findings: {r.findings.published} published · {r.findings.underReview} under review
                </span>
              </>
            }
            aside={
              <>
                <StatusLabel value={r.verificationStatus} fallback={{ label: 'Unverified', tone: 'neutral' }} />
                {!r.isActive ? <StatusLabel label="Inactive" tone="neutral" /> : null}
              </>
            }
          />
        ))}
      </RecordList>

      <p className="text-xs leading-5 text-[var(--gl-text-muted)]">
        Verification states what was checked, never a recommendation. Documents and responses you add are reviewed before they appear on the public record.
      </p>
    </section>
  )
}
