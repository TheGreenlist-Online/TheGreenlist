'use client'

import { usePathname } from 'next/navigation'
import { getDistrict } from '@/lib/districts'

/**
 * Renders the current district's name as a page eyebrow, matching the ribbon
 * under the header. Falls back to the platform name outside any district.
 */
export function DistrictLabel({ override, className }: { override?: string; className?: string }) {
  const pathname = usePathname()
  const label = override ?? getDistrict(pathname ?? '')?.name ?? 'The Green List'

  return <p className={className ?? 'greenlist-eyebrow'}>{label}</p>
}
