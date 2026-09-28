import { ReactNode } from 'react'

/** A number with its scope stated. Never a vanity metric: label says exactly what is counted. */
export function StatTile({ value, label, note }: { value: ReactNode; label: ReactNode; note?: ReactNode }) {
  return (
    <div className="gl-stat">
      <div className="gl-stat__value">{value}</div>
      <div className="gl-stat__label">{label}</div>
      {note ? <div className="gl-stat__note">{note}</div> : null}
    </div>
  )
}
