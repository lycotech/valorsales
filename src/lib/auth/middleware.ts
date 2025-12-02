/**
 * Authentication Middleware for API Routes
 * Protects API endpoints and enforces role-based access control
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { verifyToken } from './jwt'
import { prisma } from '../db/client'

import type { JWTPayload } from './jwt'
import type { UserWithoutPassword } from '@/types'

export interface AuthenticatedRequest extends NextRequest {
  user?: UserWithoutPassword
  userId?: string
}

/**
 * Extract token from request headers or cookies
 * @param request - Next.js request object
 * @returns Token string or null
 */
function extractToken(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Try cookie
  const token = request.cookies.get('auth_token')?.value

  return token || null
}

/**
 * Authenticate a request and return user
 * @param request - Next.js request object
 * @returns User object or null if not authenticated
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<UserWithoutPassword | null> {
  try {
    const token = extractToken(request)

    if (!token) {
      return null
    }

    const payload: JWTPayload | null = verifyToken(token)

    if (!payload) {
      return null
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user || !user.isActive) {
      return null
    }

    return user as UserWithoutPassword
  } catch (error) {
    console.error('Authentication error:', error)

    return null
  }
}

/**
 * Middleware to require authentication for API routes
 * @param handler - API route handler
 * @returns Wrapped handler with authentication
 */
export function requireAuth(
  handler: (request: NextRequest, user: UserWithoutPassword) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        },
        { status: 401 }
      )
    }

    return handler(request, user)
  }
}

/**
 * Middleware to require specific role(s) for API routes
 * @param roles - Array of allowed roles
 * @param handler - API route handler
 * @returns Wrapped handler with role check
 */
export function requireRole(
  roles: string[],
  handler: (request: NextRequest, user: UserWithoutPassword) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        },
        { status: 401 }
      )
    }

    // Admin has access to everything
    const hasAccess = user.role === 'admin' || roles.includes(user.role)

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to access this resource'
        },
        { status: 403 }
      )
    }

    return handler(request, user)
  }
}

/**
 * Middleware to require admin role
 * @param handler - API route handler
 * @returns Wrapped handler with admin check
 */
export function requireAdmin(
  handler: (request: NextRequest, user: UserWithoutPassword) => Promise<NextResponse>
) {
  return requireRole(['admin'], handler)
}

/**
 * Optional authentication - doesn't fail if not authenticated
 * @param handler - API route handler
 * @returns Wrapped handler with optional authentication
 */
export function optionalAuth(
  handler: (request: NextRequest, user: UserWithoutPassword | null) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request)

    return handler(request, user)
  }
}
