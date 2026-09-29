/**
 * The application's half of the role system.
 *
 * The database is the source of truth: profiles.role is typed as the app_role
 * enum, and public.role_permissions holds the grants. Everything in this file
 * mirrors those tables so that server components can make role decisions
 * without a round trip, and so client code can render the right affordances.
 *
 * That mirroring is only safe if it is checked. `npm run check:roles` diffs
 * ROLE_CATALOG and ROLE_PERMISSIONS below against role_catalog and
 * role_permissions in the database and fails on any difference. If you change
 * one side, change the other and run that script.
 *
 * Corresponding SQL, all of which resolve identically to the helpers here:
 *   public.current_platform_role()  -> PlatformRole
 *   public.role_category(app_role)  -> RoleCategory
 *   public.has_permission(text)     -> hasPermission()
 *   public.is_admin()               -> isAdmin()
 *   public.is_reviewer()            -> isReviewer()
 *   public.is_operator()            -> isOperator()
 */

export const PLATFORM_ROLES = [
  'USER',
  'BUSINESS',
  'DISTRIBUTOR',
  'CULTIVATOR',
  'MODERATOR',
  'ADMIN',
] as const

export type PlatformRole = (typeof PLATFORM_ROLES)[number]

/**
 * Roles are grouped into categories, and a role belongs to exactly one.
 * Categories do not inherit from each other: an administrator is not a
 * business, so ADMIN does not hold `business.manage`, which means "manage my
 * own listing". An admin acting on somebody else's business uses
 * `business.review` instead. Keeping these apart is what makes it possible to
 * tell, from a permission alone, whether an action was taken by the owner of a
 * thing or by the platform reviewing it.
 */
export const ROLE_CATEGORIES = ['COMMUNITY', 'OPERATOR', 'REVIEW'] as const
export type RoleCategory = (typeof ROLE_CATEGORIES)[number]

export const PLATFORM_PERMISSIONS = [
  // COMMUNITY — held by every signed-in role, because every role is also a member.
  'profile.read.self',
  'report.create',
  'forum.post',
  // OPERATOR — acting on a business you own.
  'business.manage',
  'business.documents.submit',
  'cultivation.manage',
  'distribution.manage',
  // REVIEW — acting on other people's content or accounts.
  'moderation.review',
  'moderation.warn',
  'moderation.silence',
  'moderation.restrict',
  'evidence.read.nda',
  'report.review',
  'business.review',
  'users.read',
  'users.manage_roles',
  'audit.read',
  'platform.admin',
] as const

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number]

type RoleDefinition = {
  category: RoleCategory
  label: string
  description: string
  sortOrder: number
}

/** Mirrors public.role_catalog. */
export const ROLE_CATALOG: Readonly<Record<PlatformRole, RoleDefinition>> = {
  USER: {
    category: 'COMMUNITY',
    label: 'Community member',
    description: 'Files reports, posts in the forums, manages their own profile.',
    sortOrder: 10,
  },
  BUSINESS: {
    category: 'OPERATOR',
    label: 'Business',
    description: 'Manages a claimed business listing and responds to reports about it.',
    sortOrder: 20,
  },
  CULTIVATOR: {
    category: 'OPERATOR',
    label: 'Cultivator',
    description: 'Operator role for growers, with cultivation-specific tooling.',
    sortOrder: 30,
  },
  DISTRIBUTOR: {
    category: 'OPERATOR',
    label: 'Distributor',
    description: 'Operator role for distribution, with supply-chain tooling.',
    sortOrder: 40,
  },
  MODERATOR: {
    category: 'REVIEW',
    label: 'Moderator',
    description:
      'Reviews the moderation queue and acts on community conduct. Private evidence requires a signed NDA scoped to the item.',
    sortOrder: 50,
  },
  ADMIN: {
    category: 'REVIEW',
    label: 'Administrator',
    description:
      'Full review authority plus platform operations, claim decisions and role management.',
    sortOrder: 60,
  },
}

const COMMUNITY_BASELINE: readonly PlatformPermission[] = [
  'profile.read.self',
  'report.create',
  'forum.post',
]

const OPERATOR_BASELINE: readonly PlatformPermission[] = [
  'business.manage',
  'business.documents.submit',
]

const MODERATION_POWERS: readonly PlatformPermission[] = [
  'moderation.review',
  'moderation.warn',
  'moderation.silence',
  'moderation.restrict',
  'evidence.read.nda',
]

/** Mirrors public.role_permissions. */
export const ROLE_PERMISSIONS: Readonly<Record<PlatformRole, readonly PlatformPermission[]>> = {
  USER: COMMUNITY_BASELINE,
  BUSINESS: [...COMMUNITY_BASELINE, ...OPERATOR_BASELINE],
  CULTIVATOR: [...COMMUNITY_BASELINE, ...OPERATOR_BASELINE, 'cultivation.manage'],
  DISTRIBUTOR: [...COMMUNITY_BASELINE, ...OPERATOR_BASELINE, 'distribution.manage'],
  MODERATOR: [...COMMUNITY_BASELINE, ...MODERATION_POWERS],
  ADMIN: [
    ...COMMUNITY_BASELINE,
    ...MODERATION_POWERS,
    'report.review',
    'business.review',
    'users.read',
    'users.manage_roles',
    'audit.read',
    'platform.admin',
  ],
}

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && PLATFORM_ROLES.includes(value as PlatformRole)
}

/**
 * The database column is a NOT NULL enum, so an invalid value should be
 * impossible. This stays defensive because the value still arrives over the
 * wire as JSON, and an unreadable profile row should degrade to the least
 * privileged role rather than to `undefined`.
 */
export function normalizePlatformRole(value: unknown): PlatformRole {
  if (isPlatformRole(value)) return value
  if (typeof value === 'string' && isPlatformRole(value.trim().toUpperCase())) {
    return value.trim().toUpperCase() as PlatformRole
  }
  return 'USER'
}

export function roleCategory(role: PlatformRole | null | undefined): RoleCategory {
  return ROLE_CATALOG[normalizePlatformRole(role)].category
}

export function roleLabel(role: PlatformRole | null | undefined): string {
  return ROLE_CATALOG[normalizePlatformRole(role)].label
}

export function roleDescription(role: PlatformRole | null | undefined): string {
  return ROLE_CATALOG[normalizePlatformRole(role)].description
}

export function rolesInCategory(category: RoleCategory): PlatformRole[] {
  return PLATFORM_ROLES.filter((role) => ROLE_CATALOG[role].category === category).sort(
    (a, b) => ROLE_CATALOG[a].sortOrder - ROLE_CATALOG[b].sortOrder,
  )
}

export function permissionsForRole(
  role: PlatformRole | null | undefined,
): readonly PlatformPermission[] {
  return ROLE_PERMISSIONS[normalizePlatformRole(role)]
}

/**
 * The platform owner override is the single deliberate exception to category
 * separation. Owner authority lives in server-managed account metadata
 * (auth.users.raw_app_meta_data) and cannot be self-assigned, which is why it
 * is safe to treat as absolute. In SQL this is public.is_platform_owner().
 */
export function hasPermission(
  role: PlatformRole | null | undefined,
  permission: PlatformPermission,
  isPlatformOwner = false,
) {
  if (isPlatformOwner) return true
  if (!role) return false
  return ROLE_PERMISSIONS[normalizePlatformRole(role)].includes(permission)
}

// ---------------------------------------------------------------------------
// Category predicates. Use these instead of comparing role strings, so that
// adding a role to a category does not require finding every comparison.
// ---------------------------------------------------------------------------

export function isCommunityRole(role?: PlatformRole | null) {
  return roleCategory(role) === 'COMMUNITY'
}

export function isOperatorRole(role?: PlatformRole | null) {
  return roleCategory(role) === 'OPERATOR'
}

export function isReviewRole(role?: PlatformRole | null, isPlatformOwner = false) {
  return isPlatformOwner || roleCategory(role) === 'REVIEW'
}

/** Matches public.is_reviewer(): anyone with review authority. */
export function isReviewer(role?: PlatformRole | null, isPlatformOwner = false) {
  return isReviewRole(role, isPlatformOwner)
}

/** Matches public.is_operator(). Deliberately excludes the owner override. */
export function isOperator(role?: PlatformRole | null) {
  return isOperatorRole(role)
}

/** Matches public.is_admin(). */
export function isAdmin(role?: PlatformRole | null, isPlatformOwner = false) {
  return isPlatformOwner || normalizePlatformRole(role) === 'ADMIN'
}

export function isModerator(role?: PlatformRole | null) {
  return normalizePlatformRole(role) === 'MODERATOR'
}

export function isBusiness(role?: PlatformRole | null) {
  return isOperatorRole(role)
}

export function isDistributor(role?: PlatformRole | null) {
  return normalizePlatformRole(role) === 'DISTRIBUTOR'
}

export function isCultivator(role?: PlatformRole | null) {
  return normalizePlatformRole(role) === 'CULTIVATOR'
}

// ---------------------------------------------------------------------------
// Capability helpers, grouped by the category they belong to. Each names an
// action rather than a role, so call sites do not encode the role list.
// ---------------------------------------------------------------------------

// COMMUNITY
export function canFileReport(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'report.create', isPlatformOwner)
}

export function canPostInForums(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'forum.post', isPlatformOwner)
}

// OPERATOR — acting on a business you own.
export function canManageBusiness(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'business.manage', isPlatformOwner)
}

export function canSubmitBusinessDocuments(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'business.documents.submit', isPlatformOwner)
}

// REVIEW — acting on other people's content or accounts.
export function canModerate(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'moderation.review', isPlatformOwner)
}

export function canActOnConduct(role?: PlatformRole | null, isPlatformOwner = false) {
  return (
    hasPermission(role, 'moderation.warn', isPlatformOwner) ||
    hasPermission(role, 'moderation.silence', isPlatformOwner) ||
    hasPermission(role, 'moderation.restrict', isPlatformOwner)
  )
}

/**
 * The right to reach private evidence at all. Access to a specific item is
 * still gated per report/queue item/batch by a signed NDA, enforced in RLS —
 * this only decides whether the attempt is worth making.
 */
export function canRequestEvidenceAccess(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'evidence.read.nda', isPlatformOwner)
}

export function canReviewReports(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'report.review', isPlatformOwner)
}

export function canReviewBusinessClaims(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'business.review', isPlatformOwner)
}

export function canReadAuditLog(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'audit.read', isPlatformOwner)
}

export function canManageRoles(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'users.manage_roles', isPlatformOwner)
}
