'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { SiteHeader } from '@/components/SiteHeader'
import { resolveLocation } from '@/lib/view-switch'
import { getDistrict } from '@/lib/districts'

/**
 * The persistent app shell: district theming, header, ribbon, footer.
 *
 * This is a client component only because the district is derived from the
 * pathname. `children` and `footer` are passed in from the server layout, so
 * they stay server-rendered and out of the client bundle — importing Footer
 * here instead would drag it across the boundary on every route.
 */
export function SiteFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const pathname = usePathname()
  const district = getDistrict(pathname ?? '')
  const location = pathname?.startsWith('/town') ? resolveLocation(pathname) : null

  return (
    <div className={`site-frame district--${location?.themeSlug ?? district?.slug ?? 'home'}`}>
      <SiteHeader />
      {location || district ? (
        <div className="district-ribbon" role="note" aria-label={`Current district: ${location?.name ?? district?.name}`}>
          <div className="district-ribbon__inner">
            <span className="district-ribbon__marker" aria-hidden="true" />
            <strong>{location?.name ?? district?.name}</strong>
            <span>{location?.tagline ?? district?.description}</span>
          </div>
        </div>
      ) : null}
      <div className="site-frame__content">{children}</div>
      {footer}
    </div>
  )
}
