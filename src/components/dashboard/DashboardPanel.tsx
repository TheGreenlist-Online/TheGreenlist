import Link from 'next/link'
import { ReactNode } from 'react'
import { OrnatePanel } from '@/components/OrnatePanel'

/**
 * A titled dashboard panel with an optional corner link, and a built-in empty
 * state.
 *
 * The production data set is small and a new account has nothing at all, so the
 * empty case is the common case — it gets a real message and a way forward
 * rather than a blank card.
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
    <OrnatePanel className="h-full" innerClassName="flex h-full flex-col">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="greenlist-section-title">{title}</h2>
        {action ? (
          <Link
            href={action.href}
            className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300 transition hover:text-emerald-200"
          >
            {action.label}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 flex-1">
        {isEmpty ? (
          <div className="flex h-full flex-col items-start justify-center rounded-lg border border-dashed border-white/[.10] p-6">
            <p className="text-sm font-semibold text-zinc-200">{emptyTitle}</p>
            {emptyBody ? <p className="mt-1.5 text-sm leading-6 text-zinc-500">{emptyBody}</p> : null}
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
    </OrnatePanel>
  )
}
