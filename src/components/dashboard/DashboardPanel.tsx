import Link from 'next/link'
import { ReactNode } from 'react'

/**
 * A titled desk panel with an optional corner link and a built-in empty state.
 * A new account has nothing at all, so the empty case gets a real message and
 * a way forward rather than a blank panel.
 */
export function DashboardPanel({
  title,
  action,
  children,
  isEmpty,
  emptyTitle,
  emptyBody,
  emptyAction,
}: {
  title: string
  action?: { label: string; href: string }
  children?: ReactNode
  isEmpty?: boolean
  emptyTitle?: string
  emptyBody?: string
  emptyAction?: { label: string; href: string }
}) {
  return (
    <section className="gl-panel flex h-full flex-col">
      <div className="gl-panel__head">
        <h2>{title}</h2>
        {action ? (
          <Link href={action.href} className="gl-link text-xs">
            {action.label}
          </Link>
        ) : null}
      </div>
      <div className="gl-panel__body flex-1">
        {isEmpty ? (
          <div className="flex h-full flex-col items-start justify-center border border-dashed border-[var(--gl-border)] p-5">
            <p className="text-sm font-semibold text-[var(--gl-text)]">{emptyTitle}</p>
            {emptyBody ? <p className="mt-1.5 text-sm leading-6 text-[var(--gl-text-secondary)]">{emptyBody}</p> : null}
            {emptyAction ? (
              <Link href={emptyAction.href} className="greenlist-quiet-button mt-4">
                {emptyAction.label}
              </Link>
            ) : null}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
