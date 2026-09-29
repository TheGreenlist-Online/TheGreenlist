'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { SiteHeader } from '@/components/SiteHeader'
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

  return (
    <div className={`site-frame district--${district?.slug ?? 'home'}`}>
      <SiteHeader />
      {district ? (
        <div className="district-ribbon" role="note" aria-label={`Current district: ${district.name}`}>
          <div className="district-ribbon__inner">
            <span className="district-ribbon__marker" aria-hidden="true" />
            <strong>{district.name}</strong>
            <span>{district.description}</span>
          </div>
        </div>
      ) : null}
      <div className="site-frame__content">{children}</div>
      {footer}
    </div>
  )
}
