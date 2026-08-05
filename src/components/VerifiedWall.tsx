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
        <BadgeCheck className="h-4 w-4 text-emerald-300" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Verified Wall</p>
      </div>
      <p className="mt-1 text-xs text-zinc-500">Facts and credentials confirmed by Green List moderators.</p>

      {facts.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No verified facts yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {facts.map((fact) => {
            const dateLabel = formatDate(fact.verified_at)
            return (
              <li
                key={fact.id}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
                    {formatCategory(fact.category)}
                  </span>
                  {dateLabel ? <span className="text-xs text-zinc-500">Verified {dateLabel}</span> : null}
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
