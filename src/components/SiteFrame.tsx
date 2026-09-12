'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Footer } from '@/components/Footer'
import { SiteHeader } from '@/components/SiteHeader'
import { getDistrict } from '@/lib/districts'

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const district = getDistrict(pathname)

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
      <Footer />
    </div>
  )
}
