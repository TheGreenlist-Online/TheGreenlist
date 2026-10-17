import Link from 'next/link'
import { cn } from '@/lib/utils'

type StatTileProps = {
  label: string
  value: number
  /** Small qualifier under the number, e.g. "2 awaiting review". */
  note?: string
  href: string
  /** Draws attention when something needs the user's action. */
  emphasis?: boolean
}

/**
 * One number on the desk, always a link to the thing it counts. Uses the shell
 * `.gl-stat` block; emphasis adds a review-tone left rule instead of a colour wash.
 */
export function StatTile({ label, value, note, href, emphasis }: StatTileProps) {
  const active = emphasis && value > 0
  return (
    <Link
      href={href}
      className={cn('gl-stat block transition-colors hover:border-[var(--gl-border-strong)]', active && 'border-l-[3px] border-l-[var(--gl-status-review)]')}
    >
      <p className="gl-label mb-0">{label}</p>
      <p className="gl-stat__value mt-2 tabular-nums">{value}</p>
      <p className={cn('gl-stat__note', active && 'text-[var(--gl-status-review)]')}>{note ?? '\u00a0'}</p>
    </Link>
  )
}
