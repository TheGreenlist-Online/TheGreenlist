import { ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/recordStatus'

type SourceCardProps = {
  /** Source class per /about/sources: Official record, Primary document, Business submission, Public disclosure, Public submission, Outlet. */
  sourceClass: string
  /** Issuing body, outlet, or document type. */
  origin?: string | null
  /** Where the source lives. Rendered as an outbound link when present. */
  url?: string | null
  /** Retrieval or review date. */
  date?: string | null
  /** Verification method, e.g. "Reviewed by staff", "Aggregated automatically". */
  method?: string | null
  /** Short quote or description of what the source supports. */
  supports?: string | null
}

/** Shows where a fact came from. Same fields on every record. */
export function SourceCard({ sourceClass, origin, url, date, method, supports }: SourceCardProps) {
  return (
    <div className="border border-[var(--gl-border)] bg-[var(--gl-ink)] p-4">
      <div className="gl-meta">
        <strong>{sourceClass}</strong>
        {origin ? <span>{origin}</span> : null}
        {date ? <span>Retrieved {formatDate(date)}</span> : null}
        {method ? <span>{method}</span> : null}
      </div>
      {supports ? <p className="mt-2 text-sm leading-6 text-[var(--gl-text-secondary)]">{supports}</p> : null}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="gl-link mt-2 inline-flex items-center gap-1.5 text-sm">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Open source
        </a>
      ) : (
        <p className="mt-2 text-xs text-[var(--gl-text-muted)]">Source location not publicly available.</p>
      )}
    </div>
  )
}
