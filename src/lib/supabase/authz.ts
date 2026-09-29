import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  hasPermission,
  isAdmin,
  isOperatorRole,
  isReviewRole,
  normalizePlatformRole,
  roleCategory,
  type PlatformPermission,
  type PlatformRole,
  type RoleCategory,
} from '@/lib/roles'

export type Principal = {
  user: Awaited<ReturnType<typeof getCurrentPrincipal>>['user']
  role: PlatformRole | null
  category: RoleCategory | null
  isPlatformOwner: boolean
}

/**
 * Resolves who is asking. The role comes from profiles.role, which is the
 * single source of truth and is typed as the app_role enum in the database.
 *
 * Owner authority is read from server-managed account metadata rather than
 * from the profile row, so it cannot be self-assigned. In SQL the equivalent
 * is public.is_platform_owner(), which reads auth.users directly.
 */
export async function getCurrentPrincipal() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      user: null,
      role: null,
      category: null,
      isPlatformOwner: false,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = normalizePlatformRole(profile?.role)

  return {
    supabase,
    user,
    role,
    category: roleCategory(role),
    isPlatformOwner: user.app_metadata?.platform_owner === true,
  }
}

/**
 * Prefer this over role comparisons. `permission` names the action, so the set
 * of roles allowed to perform it is decided in one place (ROLE_PERMISSIONS,
 * mirroring public.role_permissions) rather than at each call site.
 */
export async function requirePermission(permission: PlatformPermission) {
  const principal = await getCurrentPrincipal()
  return {
    ...principal,
    authorized:
      principal.user !== null &&
      hasPermission(principal.role, permission, principal.isPlatformOwner),
  }
}

/** Any role in the REVIEW category: moderators, admins, and the owner. */
export async function requireReviewer() {
  const principal = await getCurrentPrincipal()
  return {
    ...principal,
    authorized: principal.user !== null && isReviewRole(principal.role, principal.isPlatformOwner),
  }
}

/** Any role in the OPERATOR category. The owner override does not apply. */
export async function requireOperator() {
  const principal = await getCurrentPrincipal()
  return {
    ...principal,
    authorized: principal.user !== null && isOperatorRole(principal.role),
  }
}

export async function requireCategory(category: RoleCategory) {
  const principal = await getCurrentPrincipal()
  return {
    ...principal,
    authorized:
      principal.user !== null &&
      (principal.category === category ||
        (category === 'REVIEW' && principal.isPlatformOwner)),
  }
}

/**
 * Kept as the coarse gate for the /admin surface. For a specific action, use
 * requirePermission with the permission that names it — 'business.review' or
 * 'report.review' — so the route documents what authority it actually needs.
 */
export async function requireAdmin() {
  const principal = await getCurrentPrincipal()
  return {
    ...principal,
    authorized: principal.user !== null && isAdmin(principal.role, principal.isPlatformOwner),
  }
}
