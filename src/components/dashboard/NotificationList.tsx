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
    <ul className="grid gap-2">
      {items.map((item) => {
        const body = (
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className={cn('mt-1.5 h-2 w-2 shrink-0', item.isUnread ? 'bg-[var(--gl-accent-strong)]' : 'bg-[var(--gl-border-strong)]')} />
            <div className="min-w-0">
              <p className={cn('text-sm', item.isUnread ? 'font-semibold text-[var(--gl-text)]' : 'text-[var(--gl-text-secondary)]')}>
                {item.title}
                {item.isUnread ? <span className="sr-only"> (unread)</span> : null}
              </p>
              {item.body ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--gl-text-muted)]">{item.body}</p> : null}
            </div>
          </div>
        )

        const className = 'block border border-[var(--gl-border)] bg-[var(--gl-ink)] p-3 transition hover:border-[var(--gl-border-strong)]'
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className={className}>
                {body}
              </Link>
            ) : (
              <div className={className}>{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
