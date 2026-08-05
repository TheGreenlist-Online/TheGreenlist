/**
 * Single source of truth for Green List Town geography.
 *
 * The town and the standard site are two interfaces over one platform, so every
 * location declares BOTH a `townHref` and the `standardHref` of the real
 * feature it represents. Nothing here duplicates platform records — locations
 * are navigation and presentation metadata only.
 *
 * Consumers: the town map (`/town`), town location pages
 * (`/town/[locationId]`), the district ribbon (`SiteFrame`), the
 * Standard/Town view switcher, and the AI Town Guide's `getTownDestination`
 * tool. Do not re-declare this data anywhere else.
 */

export const TOWN_ICONS = [
  'archive',
  'book',
  'building',
  'compass',
  'home',
  'landmark',
  'newspaper',
  'send',
  'shield',
  'trees',
  'users',
] as const

export type TownIcon = (typeof TOWN_ICONS)[number]

/** Who may enter the location itself (not the sensitivity of its contents). */
export type TownAccess = 'public' | 'authenticated' | 'role-restricted'

/** Sensitivity of the records reachable from the location. */
export type TownVisibility = 'public' | 'private' | 'mixed'

/**
 * Theme slug driving the `district--*` custom properties in `globals.css`.
 * Several locations intentionally share one theme (the two Accountability
 * locations both read as "reports"), so this is not derivable from `id`.
 */
export type TownTheme =
  | 'businesses'
  | 'civic'
  | 'forums'
  | 'knowledge'
  | 'news'
  | 'reports'
  | 'resident'
  | 'town'
  | 'watchtower'

export type TownLocation = Readonly<{
  id: string
  name: string
  district: string
  themeSlug: TownTheme
  townHref: string
  standardHref: string
  description: string
  access: TownAccess
  visibility: TownVisibility
  /** Short tagline used by the district ribbon. */
  tagline: string
  /**
   * Standard-site path prefixes that belong to this location. Used to resolve
   * "which location am I in?" for the ribbon and the view switcher. Order
   * matters: the first location with a matching prefix wins, so more specific
   * prefixes must be declared on earlier entries.
   */
  standardPrefixes: readonly string[]
  icon: TownIcon
  /** Tailwind grid placement on the town map. */
  gridPosition: string
  /** Whether the underlying platform feature is built out yet. */
  availability: 'live' | 'planned' | 'restricted'
  featured?: boolean
  /** Guidance surfaced to the AI Town Guide. Never includes private data. */
  guideNotes: string
}>

export const TOWN_LOCATIONS: readonly TownLocation[] = [
  {
    id: 'town-square',
    name: 'Town Square',
    district: 'Civic Core',
    themeSlug: 'town',
    townHref: '/town',
    standardHref: '/',
    description:
      'The gateway to Green List Town. Announcements, trending investigations, featured verified businesses, and the AI Town Guide.',
    access: 'public',
    visibility: 'public',
    tagline: 'Arrivals · Announcements · Orientation',
    standardPrefixes: [],
    icon: 'compass',
    gridPosition: 'md:col-start-2 md:row-start-1',
    availability: 'live',
    featured: true,
    guideNotes:
      'Start here when a visitor does not know where to go. The Town Guide itself lives in the Town Square.',
  },
  {
    id: 'forum-hall',
    name: 'Forum Hall',
    district: 'Community',
    themeSlug: 'forums',
    townHref: '/town/forum-hall',
    standardHref: '/forums',
    description: 'Community discussion, questions, and public debate across the shared forum system.',
    access: 'public',
    visibility: 'mixed',
    tagline: 'Community · Discussion · Due process',
    standardPrefixes: ['/forums'],
    icon: 'users',
    gridPosition: 'md:col-start-1 md:row-start-2',
    availability: 'live',
    guideNotes:
      'Business forums are scoped views of this same forum system, not a separate engine. Some threads are restricted; never assert what a private thread contains.',
  },
  {
    id: 'transparency-archives',
    name: 'Transparency Archives',
    district: 'Accountability',
    themeSlug: 'reports',
    townHref: '/town/transparency-archives',
    standardHref: '/reports',
    description:
      'Published reports and investigations with their status history: Pending Review, Under Review, Verified, Unverified, Escalated, Resolved.',
    access: 'public',
    visibility: 'mixed',
    tagline: 'Evidence · Review · Accountability',
    standardPrefixes: ['/reports'],
    icon: 'archive',
    gridPosition: 'md:col-start-3 md:row-start-2',
    availability: 'live',
    guideNotes:
      'Only non-anonymous reports are publicly listed. Allegations are not findings — always state a report status rather than implying a business is guilty.',
  },
  {
    id: 'report-office',
    name: 'The Report Office',
    district: 'Accountability',
    themeSlug: 'reports',
    townHref: '/town/report-office',
    standardHref: '/report',
    description:
      'Submit a report, optionally anonymously, and attach supporting evidence to secure private storage.',
    access: 'authenticated',
    visibility: 'private',
    tagline: 'Intake · Confidentiality · Protection',
    standardPrefixes: ['/report', '/evidence'],
    icon: 'send',
    gridPosition: 'md:col-start-1 md:row-start-3',
    availability: 'live',
    guideNotes:
      'Explain the process only. Reporter identities and evidence files are never disclosed, not even to the reporter through the Guide.',
  },
  {
    id: 'business-district',
    name: 'Business District',
    district: 'Commerce Transparency',
    themeSlug: 'businesses',
    townHref: '/town/business-district',
    standardHref: '/businesses',
    description:
      'Business reputation profiles built on licensing, disclosures, public report history, and verification status. Not a storefront.',
    access: 'public',
    visibility: 'public',
    tagline: 'Verification · Licensing · Public trust',
    standardPrefixes: ['/businesses'],
    icon: 'building',
    gridPosition: 'md:col-start-2 md:row-start-2',
    availability: 'live',
    guideNotes:
      'No sales, ordering, delivery, menus or inventory exist anywhere on the platform. Verification status is a platform record and can never be purchased.',
  },
  {
    id: 'cultivator-grove',
    name: 'Cultivator Grove',
    district: 'Commerce Transparency',
    themeSlug: 'businesses',
    townHref: '/town/cultivator-grove',
    standardHref: '/businesses?role=CULTIVATOR',
    description: 'A filtered view of verified cultivator profiles drawn from the shared business directory.',
    access: 'public',
    visibility: 'public',
    tagline: 'Cultivation · Provenance · Practices',
    standardPrefixes: [],
    icon: 'trees',
    gridPosition: 'md:col-start-1 md:row-start-4',
    availability: 'planned',
    guideNotes:
      'This is a filter over the business directory, not a separate dataset. No transactions of any kind.',
  },
  {
    id: 'newsroom',
    name: 'The Newsroom',
    district: 'Public Interest',
    themeSlug: 'news',
    townHref: '/town/newsroom',
    standardHref: '/news',
    description: 'Investigations, platform developments, and public-interest reporting.',
    access: 'public',
    visibility: 'public',
    tagline: 'Reporting · Sources · Public interest',
    standardPrefixes: ['/news', '/trending'],
    icon: 'newspaper',
    gridPosition: 'md:col-start-3 md:row-start-3',
    availability: 'live',
    guideNotes: 'Editorial content is labelled separately from sponsored placements.',
  },
  {
    id: 'education-library',
    name: 'Education Library',
    district: 'Public Interest',
    themeSlug: 'knowledge',
    townHref: '/town/education-library',
    standardHref: '/education',
    description: 'Cannabis education, policy context, and consumer-protection resources reviewed before publication.',
    access: 'public',
    visibility: 'public',
    tagline: 'Education · Guidance · Open resources',
    standardPrefixes: ['/education', '/help', '/api-docs'],
    icon: 'book',
    gridPosition: 'md:col-start-2 md:row-start-3',
    availability: 'live',
    guideNotes:
      'Backed by the existing education_resources records. Educational context is never medical or legal advice.',
  },
  {
    id: 'town-hall',
    name: 'The Town Hall',
    district: 'Civic Core',
    themeSlug: 'civic',
    townHref: '/town/town-hall',
    standardHref: '/legal',
    description: 'Governance, platform rules, policies, standards, disclosures, and dispute resolution.',
    access: 'public',
    visibility: 'public',
    tagline: 'Policy · Governance · Public record',
    standardPrefixes: ['/legal', '/contact'],
    icon: 'landmark',
    gridPosition: 'md:col-start-3 md:row-start-4',
    availability: 'live',
    guideNotes: 'The authoritative place to send anyone asking about rules, verification criteria, or appeals.',
  },
  {
    id: 'watchtower',
    name: 'The Watchtower',
    district: 'Oversight',
    themeSlug: 'watchtower',
    townHref: '/town/watchtower',
    standardHref: '/admin/moderation',
    description: 'Role-protected moderation, review standards, appeals, and platform oversight.',
    access: 'role-restricted',
    visibility: 'private',
    tagline: 'Moderation · Safety · Oversight',
    standardPrefixes: ['/admin'],
    icon: 'shield',
    gridPosition: 'md:col-start-2 md:row-start-4',
    availability: 'restricted',
    guideNotes:
      'Describe that moderation exists and that humans decide. Never describe queue contents, internal notes, or pending actions.',
  },
  {
    id: 'resident-base',
    name: 'My House',
    district: 'Resident Services',
    themeSlug: 'resident',
    townHref: '/town/resident-base',
    standardHref: '/dashboard',
    description:
      'Your personal resident base: profile, reputation, saved investigations, submitted reports, forum activity, verification status, and settings.',
    access: 'authenticated',
    visibility: 'mixed',
    tagline: 'Account · Preferences · Participation',
    standardPrefixes: ['/dashboard', '/profile', '/settings', '/auth', '/login', '/register', '/sign-in', '/sign-up'],
    icon: 'home',
    gridPosition: 'md:col-start-3 md:row-start-1',
    availability: 'live',
    guideNotes:
      'Personal data is private by default. Public display of any field is opt-in and controlled by the resident.',
  },
] as const

const LOCATIONS_BY_ID = new Map(TOWN_LOCATIONS.map((location) => [location.id, location]))

export function getTownLocation(id: string): TownLocation | null {
  return LOCATIONS_BY_ID.get(id) ?? null
}

/** Locations a visitor with the given authentication state can be sent to. */
export function getReachableTownLocations(isAuthenticated: boolean): readonly TownLocation[] {
  return TOWN_LOCATIONS.filter((location) => {
    if (location.access === 'role-restricted') return false
    if (location.access === 'authenticated') return isAuthenticated
    return true
  })
}

/**
 * Resolve the town location that owns a standard-site path.
 * Returns null for paths that have no town equivalent.
 */
export function findLocationByStandardPath(pathname: string): TownLocation | null {
  if (pathname === '/') return getTownLocation('town-square')

  let match: TownLocation | null = null
  let matchedPrefixLength = 0

  for (const location of TOWN_LOCATIONS) {
    for (const prefix of location.standardPrefixes) {
      const isMatch = pathname === prefix || pathname.startsWith(`${prefix}/`)
      if (isMatch && prefix.length > matchedPrefixLength) {
        match = location
        matchedPrefixLength = prefix.length
      }
    }
  }

  return match
}

/** Resolve the town location that owns a `/town/...` path. */
export function findLocationByTownPath(pathname: string): TownLocation | null {
  if (pathname === '/town') return getTownLocation('town-square')

  const [, , locationId] = pathname.split('/')
  return locationId ? getTownLocation(locationId) : null
}

export const TOWN_DISTRICTS: readonly string[] = TOWN_LOCATIONS.map((location) => location.district).filter(
  (district, index, all) => all.indexOf(district) === index,
)
