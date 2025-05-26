import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard, /login)
  const { pathname } = request.nextUrl

  // Define protected routes
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // If it's a protected route, check for authentication
  if (isProtectedRoute) {
    // Check for auth token in cookies or headers
    const token = request.cookies.get('patchline-auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    // If no token found, redirect to login
    if (!token || token === 'undefined') {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // TODO: In production, validate the JWT token here
    // For now, we'll accept any token
  }

  // If user is on login page and already authenticated, redirect to dashboard
  if (pathname === '/login') {
    const token = request.cookies.get('patchline-auth-token')?.value
    if (token && token !== 'undefined') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
} 