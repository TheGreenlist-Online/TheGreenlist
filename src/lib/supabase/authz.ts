import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  hasPermission,
  normalizePlatformRole,
  type PlatformPermission,
} from '@/lib/roles'

export async function getCurrentPrincipal() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, role: null, isPlatformOwner: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return {
    supabase,
    user,
    role: normalizePlatformRole(profile?.role),
    isPlatformOwner: user.app_metadata?.platform_owner === true,
  }
}

export async function requirePermission(permission: PlatformPermission) {
  const principal = await getCurrentPrincipal()
  return {
    ...principal,
    authorized:
      principal.user !== null &&
      hasPermission(principal.role, permission, principal.isPlatformOwner),
  }
}

export function requireAdmin() {
  return requirePermission('platform:admin')
}
