import Link from 'next/link'
import type { NotificationItem } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

/**
 * Recent notifications, unread ones marked with a lime dot.
 *
 * The `notifications` table already existed in the schema but nothing in the
 * interface ever read it, so status changes on a user's own reports were
 * invisible to them.
 */
export function NotificationList({ items }: { items: NotificationItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const body = (
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                item.isUnread ? 'bg-lime-300' : 'bg-zinc-700',
              )}
            />
            <div className="min-w-0">
              <p className={cn('text-sm', item.isUnread ? 'font-semibold text-zinc-100' : 'text-zinc-300')}>
                {item.title}
                {item.isUnread ? <span className="sr-only"> (unread)</span> : null}
              </p>
              {item.body ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{item.body}</p> : null}
            </div>
          </div>
        )

        return (
          <li key={item.id}>
            {item.href ? (
              <Link
                href={item.href}
                className="block rounded-lg border border-white/[.06] bg-white/[.02] p-3 transition hover:border-emerald-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
              >
                {body}
              </Link>
            ) : (
              <div className="rounded-lg border border-white/[.06] bg-white/[.02] p-3">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
