import { NextResponse, type NextRequest } from 'next/server'
import { updateSupabaseSession } from '@/lib/supabase/proxy'
import { hasPermission, normalizePlatformRole } from '@/lib/roles'

function loginUrl(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/auth/signin'
  url.searchParams.set('callbackUrl', request.nextUrl.pathname)
  return url
}

function dashboardUrl(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard'
  url.search = ''
  return url
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const { response, supabase, user } = await updateSupabaseSession(request)

  if (!user) {
    return NextResponse.redirect(loginUrl(request))
  }

  if (pathname.startsWith('/admin')) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = normalizePlatformRole(profile?.role)
    const isPlatformOwner = user.app_metadata?.platform_owner === true

    if (error || !hasPermission(role, 'platform:admin', isPlatformOwner)) {
      return NextResponse.redirect(dashboardUrl(request))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
