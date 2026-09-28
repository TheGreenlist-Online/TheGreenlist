import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type LedgerRow = { label: ReactNode; value: ReactNode; note?: ReactNode }

type LedgerProps = {
  title?: ReactNode
  /** Right-hand meta in the panel head, e.g. "Record opened Sep 26, 2026". */
  aside?: ReactNode
  rows: LedgerRow[]
  className?: string
  /** Render without the panel chrome (for nesting inside another panel). */
  bare?: boolean
}

/**
 * Documentation ledger: label / value rows. Used for record facts, profile
 * status, submission details, and settings summaries. Empty values should be
 * passed as explicit text ("Not stated", "Not available") — never blank.
 */
export function Ledger({ title, aside, rows, className, bare }: LedgerProps) {
  const table = (
    <table className="gl-ledger">
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            <th scope="row">{row.label}</th>
            <td>
              {row.value}
              {row.note ? <span className="mt-1 block text-xs text-[var(--gl-text-muted)]">{row.note}</span> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
  if (bare) return table
  return (
    <section className={cn('gl-panel', className)}>
      {title || aside ? (
        <div className="gl-panel__head">
          {title ? <h2>{title}</h2> : <span />}
          {aside ? <span className="gl-meta">{aside}</span> : null}
        </div>
      ) : null}
      {table}
    </section>
  )
}
