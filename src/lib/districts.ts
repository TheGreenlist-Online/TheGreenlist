export type District = {
  prefixes: readonly string[]
  slug: string
  name: string
  description: string
}

/**
 * Single source of truth for the district shell. The ribbon under the header
 * and the eyebrow label on each page both read from this list, so a page can
 * never advertise a different district than the ribbon above it.
 */
export const districts: readonly District[] = [
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

export function getDistrict(pathname: string): District | undefined {
  return districts.find((district) => district.prefixes.some((prefix) => pathname.startsWith(prefix)))
}
