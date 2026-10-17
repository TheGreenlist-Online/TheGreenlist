'use client'

import { usePathname } from 'next/navigation'
import { getSection } from '@/lib/districts'

/**
 * Renders the current section name as the page eyebrow, matching the active
 * item in the primary navigation. Falls back to the platform name outside any
 * registered section.
 */
export function DistrictLabel({ override, className }: { override?: string; className?: string }) {
  const pathname = usePathname()
  const label = override ?? getSection(pathname ?? '')?.name ?? 'The Green List'

  return <p className={className ?? 'greenlist-eyebrow'}>{label}</p>
}

export { DistrictLabel as SectionLabel }
