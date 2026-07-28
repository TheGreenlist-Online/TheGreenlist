'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCounterpartPath, getCurrentView, getSwitchLabel } from '@/lib/view-switch'

/**
 * Standard ⇄ Town switcher.
 *
 * `href` is resolved from the pathname alone so the link is a real, crawlable
 * URL and middle-click still works. On a normal click we recompute from
 * `window.location`, which also carries the query string and hash — that is how
 * filters, search terms and pagination survive the switch. Reading the query
 * via `useSearchParams` instead would force a Suspense boundary around the
 * whole site frame and opt every static page out of prerendering.
 */

type ViewSwitchLinkProps = {
  className?: string
  onNavigate?: () => void
  children?: (label: string) => React.ReactNode
}

export function ViewSwitchLink({ className, onNavigate, children }: ViewSwitchLinkProps) {
  const router = useRouter()
  const pathname = usePathname()
  const label = getSwitchLabel(getCurrentView(pathname))

  return (
    <Link
      href={getCounterpartPath(pathname)}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        event.preventDefault()
        const { pathname: path, search, hash } = window.location
        onNavigate?.()
        router.push(getCounterpartPath(`${path}${search}${hash}`))
      }}
    >
      {children ? children(label) : label}
    </Link>
  )
}
