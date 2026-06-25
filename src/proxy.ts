import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

function loginUrl(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/auth/signin'
  url.searchParams.set('callbackUrl', request.nextUrl.pathname)
  return url
}

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const pathname = request.nextUrl.pathname

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
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
