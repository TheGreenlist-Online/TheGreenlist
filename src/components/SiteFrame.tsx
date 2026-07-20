'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Footer } from '@/components/Footer'
import { SiteHeader } from '@/components/SiteHeader'

const districts = [
  { prefixes: ['/reports', '/report', '/evidence'], slug: 'reports', name: 'Reports Bureau', description: 'Evidence · Review · Accountability' },
  { prefixes: ['/forums'], slug: 'forums', name: 'Forum Hall', description: 'Community · Discussion · Due process' },
  { prefixes: ['/businesses'], slug: 'businesses', name: 'Business District', description: 'Verification · Licensing · Public trust' },
  { prefixes: ['/news', '/trending'], slug: 'news', name: 'Newsroom', description: 'Reporting · Sources · Public interest' },
  { prefixes: ['/education', '/help', '/api-docs'], slug: 'knowledge', name: 'Knowledge Library', description: 'Education · Guidance · Open resources' },
  { prefixes: ['/legal', '/contact'], slug: 'civic', name: 'Civic Center', description: 'Policy · Governance · Public record' },
  { prefixes: ['/admin'], slug: 'watchtower', name: 'The Watchtower', description: 'Moderation · Safety · Oversight' },
  { prefixes: ['/dashboard', '/profile', '/settings', '/auth', '/login', '/register', '/sign-in', '/sign-up'], slug: 'resident', name: 'Resident Services', description: 'Account · Preferences · Participation' },
  { prefixes: ['/town'], slug: 'town', name: 'Green List Town', description: 'One community · Every district' },
] as const

function getDistrict(pathname: string) {
  return districts.find((district) => district.prefixes.some((prefix) => pathname.startsWith(prefix)))
}

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
