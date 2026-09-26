import { BadgeCheck, ExternalLink } from 'lucide-react'
import { OrnatePanel } from '@/components/OrnatePanel'

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
    <OrnatePanel>
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-[var(--gl-text-muted)]" aria-hidden="true" />
        <p className="greenlist-eyebrow">Confirmed facts</p>
      </div>
      <p className="mt-1 text-xs text-[var(--gl-text-muted)]">
        Facts reviewed by Green List staff against a stated source. Subjects cannot add or edit these entries.
      </p>

      {facts.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--gl-text-muted)]">No facts have been confirmed for this record.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {facts.map((fact) => {
            const dateLabel = formatDate(fact.verified_at)
            return (
              <li
                key={fact.id}
                className="border border-[var(--gl-border)] bg-[var(--gl-ink)] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="gl-status gl-status--confirmed">
                    {formatCategory(fact.category)}
                  </span>
                  {dateLabel ? <span className="gl-meta">Reviewed {dateLabel}</span> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-200">{fact.fact_text}</p>
                {fact.source_url ? (
                  <a
                    href={fact.source_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Source
                  </a>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </OrnatePanel>
  )
}
