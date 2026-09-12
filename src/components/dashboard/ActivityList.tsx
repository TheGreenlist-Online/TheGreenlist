import Link from 'next/link'
import type { ActivityItem } from '@/lib/dashboard'
import { statusBadgeBase, toneClass } from '@/lib/statusTones'

const KIND_LABEL: Record<ActivityItem['kind'], string> = {
  Report: 'Report',
  Resource: 'Resource',
  Discussion: 'Discussion',
}

/** "3 days ago" — relative time is what you want when scanning your own activity. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.35, 'week'],
    [12, 'month'],
  ]

  let value = seconds
  let unit: Intl.RelativeTimeFormatUnit = 'second'

  for (const [size, nextUnit] of units) {
    if (Math.abs(value) < size) break
    value = Math.round(value / size)
    unit = nextUnit
  }

  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-value, unit)
}

/**
 * The user's own recent submissions across reports, resources and threads,
 * newest first, each with the status a reviewer has put it in.
 *
 * This is the answer to "what happened to the thing I filed?", which the old
 * dashboard could not answer at all.
 */
export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="divide-y divide-white/[.06]">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 py-4 transition hover:bg-white/[.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
          >
            {/* Wide enough for "Discussion" at this tracking; narrower and it
                collides with the title. */}
            <span className="w-[6.5rem] shrink-0 pr-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {KIND_LABEL[item.kind]}
            </span>

            <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">{item.title}</span>

            <span className={`${statusBadgeBase} ${toneClass(item.tone)} shrink-0`}>{item.status}</span>

            <span className="shrink-0 text-xs tabular-nums text-zinc-500">{relativeTime(item.createdAt)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
