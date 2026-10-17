import { ReactNode } from 'react'
import { formatDate } from '@/lib/recordStatus'

export type TimelineEvent = { at: string | Date | null | undefined; what: ReactNode; who?: string | null }

/** Public change log: what happened to the record and when. */
export function RecordTimeline({ events, emptyText = 'No changes have been logged for this record.' }: { events: TimelineEvent[]; emptyText?: string }) {
  if (!events.length) return <p className="text-sm text-[var(--gl-text-muted)]">{emptyText}</p>
  return (
    <ol className="gl-timeline">
      {events.map((event, index) => (
        <li key={index}>
          <span className="gl-timeline__when">
            {formatDate(event.at, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            {event.who ? ` · ${event.who}` : ''}
          </span>
          <div className="gl-timeline__what">{event.what}</div>
        </li>
      ))}
    </ol>
  )
}
