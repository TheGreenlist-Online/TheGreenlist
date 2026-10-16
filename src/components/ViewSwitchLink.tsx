'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { getCounterpartPath, getCurrentView, getSwitchLabel } from '@/lib/view-switch'

/**
 * Standard ⇄ Town switcher.
 *
 * The anchor href includes the current path, query and hash so direct browser
 * navigation preserves filters, search terms and pagination. The local
 * Suspense boundary keeps useSearchParams from affecting the rest of the page.
 */

type ViewSwitchLinkProps = {
  className?: string
  onNavigate?: () => void
  children?: (label: string) => React.ReactNode
}

export function ViewSwitchLink({ className, onNavigate, children }: ViewSwitchLinkProps) {
  const pathname = usePathname()
  const label = getSwitchLabel(getCurrentView(pathname))

  return (
    <Suspense
      fallback={
        <Link href={getCounterpartPath(pathname)} className={className}>
          {children ? children(label) : label}
        </Link>
      }
    >
      <ViewSwitchLinkWithUrl
        pathname={pathname}
        label={label}
        className={className}
        onNavigate={onNavigate}
      >
        {children}
      </ViewSwitchLinkWithUrl>
    </Suspense>
  )
}

function ViewSwitchLinkWithUrl({
  pathname,
  label,
  className,
  onNavigate,
  children,
}: ViewSwitchLinkProps & { pathname: string; label: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hash, setHash] = useState('')

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash)
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => {
      window.removeEventListener('hashchange', syncHash)
    }
  }, [pathname])

  const query = searchParams.toString()
  const currentUrl = `${pathname}${query ? `?${query}` : ''}${hash}`

  return (
    <Link
      href={getCounterpartPath(currentUrl)}
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
