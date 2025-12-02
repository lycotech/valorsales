/**
 * Session Management Utilities
 * Handles user authentication state and session tokens
 */

import { cookies } from 'next/headers'

import { verifyToken } from './jwt'
import { prisma } from '../db/client'

import type { JWTPayload } from './jwt'
import type { UserWithoutPassword } from '@/types'

// Cookie configuration
const TOKEN_COOKIE_NAME = 'auth_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

/**
 * Get the current user from the session token
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(): Promise<UserWithoutPassword | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const payload = verifyToken(token)

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
    console.error('Error getting current user:', error)

    return null
  }
}

/**
 * Get the JWT payload from the current session
 * @returns JWT payload or null if not authenticated
 */
export async function getSessionPayload(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const payload = verifyToken(token)

    return payload
  } catch (error) {
    console.error('Error getting session payload:', error)

    return null
  }
}

/**
 * Check if user is authenticated
 * @returns True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()

  return user !== null
}

/**
 * Check if user has a specific role
 * @param requiredRole - Required role to check
 * @returns True if user has the role, false otherwise
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  return user.role === requiredRole || user.role === 'admin'
}

/**
 * Check if user has any of the specified roles
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles, false otherwise
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  return roles.includes(user.role) || user.role === 'admin'
}

/**
 * Set authentication cookie with token
 * @param token - JWT token to store
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  })
}

/**
 * Clear authentication cookie (logout)
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(TOKEN_COOKIE_NAME)
}

/**
 * Get the authentication token from cookies
 * @returns Token string or null
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value

    return token || null
  } catch (error) {
    console.error('Error getting auth token:', error)

    return null
  }
}
