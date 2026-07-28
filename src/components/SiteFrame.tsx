'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Footer } from '@/components/Footer'
import { SiteHeader } from '@/components/SiteHeader'
import { resolveLocation } from '@/lib/view-switch'

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // The landing page is the site entrance rather than a district, so it keeps
  // the neutral theme and shows no ribbon.
  const location = pathname === '/' ? null : resolveLocation(pathname)

  return (
    <div className={`site-frame district--${location?.themeSlug ?? 'home'}`}>
      <SiteHeader />
      {location ? (
        <div className="district-ribbon" role="note" aria-label={`Current district: ${location.name}`}>
          <div className="district-ribbon__inner">
            <span className="district-ribbon__marker" aria-hidden="true" />
            <strong>{location.name}</strong>
            <span>{location.tagline}</span>
          </div>
        </div>
      ) : null}
      <div className="site-frame__content">{children}</div>
      <Footer />
    </div>
  )
}
