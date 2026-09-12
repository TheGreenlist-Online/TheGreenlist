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
 * One number on the dashboard, always a link to the thing it counts.
 *
 * A count you can't act on is trivia, so every tile navigates. The number is
 * tabular so a column of tiles doesn't jitter between values.
 */
export function StatTile({ label, value, note, href, emphasis }: StatTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-xl border bg-brand-panel p-5 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60',
        emphasis ? 'border-amber-300/35 hover:border-amber-300/55' : 'border-white/[.09] hover:border-emerald-300/35',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p
        className={cn(
          'mt-3 text-3xl font-semibold tabular-nums',
          emphasis && value > 0 ? 'text-amber-200' : 'text-zinc-50',
        )}
      >
        {value}
      </p>
      <p className={cn('mt-1 text-xs leading-5', emphasis && value > 0 ? 'text-amber-200/75' : 'text-zinc-500')}>
        {note ?? '\u00a0'}
      </p>
    </Link>
  )
}
