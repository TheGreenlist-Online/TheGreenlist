export const PLATFORM_ROLES = [
  'USER',
  'BUSINESS',
  'DISTRIBUTOR',
  'CULTIVATOR',
  'MODERATOR',
  'ADMIN',
] as const

export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export const PLATFORM_PERMISSIONS = [
  'business:manage',
  'content:moderate',
  'forum:manage',
  'platform:admin',
  'roles:manage',
] as const

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number]

const ROLE_PERMISSIONS: Readonly<Record<PlatformRole, readonly PlatformPermission[]>> = {
  USER: [],
  BUSINESS: ['business:manage'],
  DISTRIBUTOR: ['business:manage'],
  CULTIVATOR: ['business:manage'],
  MODERATOR: ['content:moderate'],
  ADMIN: ['business:manage', 'content:moderate', 'forum:manage', 'platform:admin'],
}

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && PLATFORM_ROLES.includes(value as PlatformRole)
}

export function normalizePlatformRole(value: unknown): PlatformRole {
  return isPlatformRole(value) ? value : 'USER'
}

export function hasPermission(
  role: PlatformRole | null | undefined,
  permission: PlatformPermission,
  isPlatformOwner = false,
) {
  if (isPlatformOwner) return true
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false
}

export function isAdmin(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'platform:admin', isPlatformOwner)
}

export function isBusiness(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'business:manage', isPlatformOwner)
}

export function isDistributor(role?: PlatformRole | null, isPlatformOwner = false) {
  return isPlatformOwner || role === 'DISTRIBUTOR' || role === 'ADMIN'
}

export function canManageBusiness(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'business:manage', isPlatformOwner)
}

export function canModerate(role?: PlatformRole | null, isPlatformOwner = false) {
  return hasPermission(role, 'content:moderate', isPlatformOwner)
}
