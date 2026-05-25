import { UserRole } from '@prisma/client'

export const USER_ROLES = [
  UserRole.USER,
  UserRole.BUSINESS,
  UserRole.DISTRIBUTOR,
  UserRole.ADMIN,
] as const

export function isAdmin(role?: UserRole | null) {
  return role === UserRole.ADMIN
}

export function isBusiness(role?: UserRole | null) {
  return role === UserRole.BUSINESS || role === UserRole.ADMIN
}

export function isDistributor(role?: UserRole | null) {
  return role === UserRole.DISTRIBUTOR || role === UserRole.ADMIN
}

export function canManageBusiness(role?: UserRole | null) {
  return role === UserRole.BUSINESS || role === UserRole.DISTRIBUTOR || role === UserRole.ADMIN
}

export function canModerate(role?: UserRole | null) {
  return role === UserRole.ADMIN
}
