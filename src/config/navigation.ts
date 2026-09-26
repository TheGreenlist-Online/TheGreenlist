/**
 * The single source of truth for site navigation.
 *
 * Every navigation surface — utility bar, primary nav, mobile menu, footer —
 * reads from this file, so a section can never be named one thing in the
 * header and another in the footer.
 */

export type NavItem = {
  readonly label: string
  readonly href: string
  /** One-line statement of what the section is for. Shown in menus and footers. */
  readonly purpose: string
}

/** Governance links. These stay visible on every page, above the header. */
export const GOVERNANCE_LINKS: readonly NavItem[] = [
  { label: 'Methodology', href: '/about/methodology', purpose: 'How records are built, reviewed, and labelled.' },
  { label: 'Data Sources', href: '/about/sources', purpose: 'Where the information comes from and how it is obtained.' },
  { label: 'Funding & Independence', href: '/about/funding', purpose: 'Who pays for the work and what money cannot buy.' },
  { label: 'Corrections', href: '/about/corrections', purpose: 'How to dispute or correct a published record.' },
] as const

/** The emphasised utility action. Kept separate so it is always rendered last. */
export const SUBMIT_EVIDENCE: NavItem = {
  label: 'Submit Evidence',
  href: '/evidence/upload',
  purpose: 'Provide documents or a report through the private intake.',
}

/** Primary sections. Order is deliberate: records first, participation last. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Records', href: '/businesses', purpose: 'Business, licence, and documentation records.' },
  { label: 'Reports', href: '/reports', purpose: 'Structured accountability reports and their review status.' },
  { label: 'Evidence', href: '/evidence', purpose: 'Private-by-default document intake supporting reports.' },
  { label: 'News', href: '/news', purpose: 'Source-linked industry, policy, and enforcement coverage.' },
  { label: 'Standards', href: '/about/methodology', purpose: 'Status definitions, review rules, and record scope.' },
  { label: 'Learn', href: '/education', purpose: 'Testing, labelling, licensing, and consumer-rights explainers.' },
  { label: 'Evidence Desk', href: '/forums', purpose: 'Public discussion attached to records, sources, and open documentation requests.' },
  { label: 'About', href: '/about', purpose: 'Mission, governance, scope, and contact.' },
] as const

/** Account-area links for signed-in users. */
export const ACCOUNT_NAV: readonly NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', purpose: 'Your filings, submissions, and notifications.' },
  { label: 'Settings', href: '/settings', purpose: 'Account, security, and display preferences.' },
] as const

export const LEGAL_NAV: readonly NavItem[] = [
  { label: 'Terms of Service', href: '/legal/terms', purpose: '' },
  { label: 'Privacy Policy', href: '/legal/privacy', purpose: '' },
  { label: 'FTC Disclosures', href: '/legal/ftc', purpose: '' },
  { label: 'DMCA', href: '/legal/dmca', purpose: '' },
  { label: 'Contact', href: '/contact', purpose: '' },
] as const

/**
 * Returns true when `href` is the section that owns `pathname`. Section roots
 * match their sub-routes; the homepage only matches itself.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * The single nav item that owns `pathname`: the longest matching href wins,
 * so `/about/methodology` lights "Standards" rather than "About".
 */
export function activeHref(pathname: string, items: readonly NavItem[]): string | undefined {
  let best: string | undefined
  for (const item of items) {
    if (isActivePath(pathname, item.href) && (!best || item.href.length > best.length)) best = item.href
  }
  return best
}
