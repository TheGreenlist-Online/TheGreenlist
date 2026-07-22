import { createSupabaseServerClient } from '@/lib/supabase/server'

export const PLATFORM_ROLES = [
  'USER',
  'BUSINESS',
  'DISTRIBUTOR',
  'CULTIVATOR',
  'MODERATOR',
  'ADMIN',
] as const

export type PlatformRole = (typeof PLATFORM_ROLES)[number]

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
    role: (profile?.role as PlatformRole | undefined) ?? 'USER',
    isPlatformOwner: user.app_metadata?.platform_owner === true,
  }
}

export async function requireAdmin() {
  const principal = await getCurrentPrincipal()
  return {
    ...principal,
    authorized: principal.user !== null && (principal.role === 'ADMIN' || principal.isPlatformOwner),
  }
}
