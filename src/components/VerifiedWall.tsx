import { Panel, SourceCard } from '@/components/record'

export type VerifiedFact = {
  id: string
  fact_text: string
  category: string
  source_url: string | null
  verified_at: string
}

function formatCategory(category: string) {
  return category.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

/**
 * Displays moderator-verified facts/claims/credentials for a user or business.
 * This content is curated exclusively by admins (see /api/verified-facts) —
 * subjects cannot add or edit their own entries, which is what makes the
 * "Verified Wall" trustworthy.
 */
export function VerifiedWall({ facts }: { facts: VerifiedFact[] }) {
  return (
    <Panel title="Confirmed facts" aside={<span>Staff-reviewed against a stated source</span>}>
      {facts.length === 0 ? (
        <p className="text-sm text-[var(--gl-text-muted)]">No facts have been confirmed for this record.</p>
      ) : (
        <ul className="grid gap-3">
          {facts.map((fact) => {
            const dateLabel = formatDate(fact.verified_at)
            return (
              <li key={fact.id} className="border border-[var(--gl-border)] bg-[var(--gl-ink)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="gl-status gl-status--confirmed">{formatCategory(fact.category)}</span>
                  {dateLabel ? <span className="gl-meta">Reviewed {dateLabel}</span> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--gl-text)]">{fact.fact_text}</p>
                <div className="mt-3">
                  <SourceCard sourceClass="Primary document" url={fact.source_url} date={fact.verified_at} method="Reviewed by staff" />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
