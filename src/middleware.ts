/**
 * Next.js Middleware for Route Protection
 * Runs before requests are processed
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { verifyTokenEdge } from '@/lib/auth/jwt'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth/login']

// API routes that don't require authentication
const PUBLIC_API_ROUTES = ['/api/auth/login', '/api/health']

/**
 * Middleware function to protect routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for authentication token
  const token = request.cookies.get('auth_token')?.value

  console.log('🔍 Middleware check:', { pathname, hasToken: !!token })

  // Redirect to login if no token for protected pages
  if (!token && !pathname.startsWith('/api')) {
    const loginUrl = new URL('/login', request.url)

    loginUrl.searchParams.set('redirect', pathname)

    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  if (token) {
    const payload = await verifyTokenEdge(token)

    console.log('🔐 Token verification:', { isValid: !!payload, payload })

    if (!payload) {
      // Token is invalid or expired
      console.log('❌ Token verification failed')

      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or expired token'
          },
          { status: 401 }
        )
      } else {
        // Redirect to login for invalid token on pages
        const loginUrl = new URL('/login', request.url)

        loginUrl.searchParams.set('redirect', pathname)
        loginUrl.searchParams.set('error', 'session_expired')

        return NextResponse.redirect(loginUrl)
      }
    }
  }

  return NextResponse.next()
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|images).*)'
  ]
}
