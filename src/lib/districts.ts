/**
 * Section registry.
 *
 * Historically these were "districts" of a town metaphor. The platform now
 * presents as a records institution, so each entry is a plain section with a
 * record-type label and a one-line scope statement. The eyebrow on every page
 * reads from this list, so a page can never advertise a different section
 * than the navigation above it.
 *
 * The `District` name and `getDistrict` export are retained so existing call
 * sites keep compiling.
 */
import { EVIDENCE_DESK_NAV_ITEM } from '@/config/navigation'

export type District = {
  prefixes: readonly string[]
  slug: string
  /** Section label shown as the page eyebrow. */
  name: string
  /** Scope statement: what the section holds. */
  description: string
}

export type Section = District

export const districts: readonly District[] = [
  { prefixes: ['/reports', '/report'], slug: 'reports', name: 'Reports', description: 'Structured accountability reports and review status' },
  { prefixes: ['/evidence'], slug: 'evidence', name: 'Evidence', description: 'Private-by-default document intake' },
  { prefixes: ['/forums'], slug: 'evidence-desk', name: EVIDENCE_DESK_NAV_ITEM.label, description: 'Public discussion attached to records and sources' },
  { prefixes: ['/businesses'], slug: 'records', name: 'Records', description: 'Business, licence, and documentation records' },
  { prefixes: ['/news', '/trending'], slug: 'news', name: 'News', description: 'Source-linked industry, policy, and enforcement coverage' },
  { prefixes: ['/education', '/help', '/api-docs'], slug: 'learn', name: 'Learn', description: 'Testing, labelling, licensing, and consumer-rights explainers' },
  { prefixes: ['/about'], slug: 'governance', name: 'Governance', description: 'Methodology, sources, funding, and corrections' },
  { prefixes: ['/legal', '/contact'], slug: 'policy', name: 'Policy', description: 'Terms, privacy, disclosures, and contact' },
  { prefixes: ['/admin'], slug: 'review', name: 'Review Operations', description: 'Role-protected review, moderation, and oversight' },
  { prefixes: ['/dashboard', '/profile', '/settings', '/auth', '/login', '/register', '/sign-in', '/sign-up'], slug: 'account', name: 'Account', description: 'Your filings, submissions, and preferences' },
] as const

export const sections = districts

export function getDistrict(pathname: string): District | undefined {
  return districts.find((district) => district.prefixes.some((prefix) => pathname.startsWith(prefix)))
}

export const getSection = getDistrict
