import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const legacyAuthRedirects: Record<string, string> = {
  '/login': '/auth/signin',
  '/signin': '/auth/signin',
  '/sign-in': '/auth/signin',
  '/signup': '/auth/register',
  '/sign-up': '/auth/register',
  '/register': '/auth/register',
}

function loginUrl(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/auth/signin'
  url.searchParams.set('callbackUrl', request.nextUrl.pathname)
  return url
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const legacyTarget = legacyAuthRedirects[pathname]

  if (legacyTarget) {
    const url = request.nextUrl.clone()
    url.pathname = legacyTarget
    url.search = ''
    return NextResponse.redirect(url)
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    return NextResponse.redirect(loginUrl(request))
  }

  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/signin',
    '/sign-in',
    '/signup',
    '/sign-up',
    '/register',
  ],
}
