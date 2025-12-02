/**
 * Server-side Permission Middleware
 * Checks permissions for API routes
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { hasPermission, type Resource, type Action } from './permissions'
import { getCurrentUser } from './session'

import type { UserWithoutPassword } from '@/types'

/**
 * Helper to authenticate request and get user
 */
async function authenticateRequest(): Promise<UserWithoutPassword | null> {
  try {
    const user = await getCurrentUser()

    return user
  } catch {
    return null
  }
}

/**
 * Middleware to check if user has permission for a resource action
 * @param resource - Resource to check
 * @param action - Action to check
 * @param handler - API route handler
 * @returns Wrapped handler with permission check
 */
export function requirePermission(
  resource: Resource,
  action: Action,
  handler: (request: NextRequest, user: UserWithoutPassword) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // First authenticate the user
    const user = await authenticateRequest()

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

    // Check if user has the required permission
    const hasAccess = hasPermission(user.role, resource, action)

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: `You don't have permission to ${action} ${resource}`
        },
        { status: 403 }
      )
    }

    // User is authenticated and has permission, proceed to handler
    return handler(request, user)
  }
}

/**
 * Middleware to check multiple permissions (user must have at least one)
 * @param permissions - Array of resource-action pairs
 * @param handler - API route handler
 * @returns Wrapped handler with permission check
 */
export function requireAnyPermission(
  permissions: Array<{ resource: Resource; action: Action }>,
  handler: (request: NextRequest, user: UserWithoutPassword) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest()

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

    // Check if user has at least one of the required permissions
    const hasAccess = permissions.some(({ resource, action }) =>
      hasPermission(user.role, resource, action)
    )

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You don\'t have the required permissions'
        },
        { status: 403 }
      )
    }

    return handler(request, user)
  }
}

/**
 * Middleware to check multiple permissions (user must have all)
 * @param permissions - Array of resource-action pairs
 * @param handler - API route handler
 * @returns Wrapped handler with permission check
 */
export function requireAllPermissions(
  permissions: Array<{ resource: Resource; action: Action }>,
  handler: (request: NextRequest, user: UserWithoutPassword) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest()

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

    // Check if user has all required permissions
    const hasAccess = permissions.every(({ resource, action }) =>
      hasPermission(user.role, resource, action)
    )

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You don\'t have all the required permissions'
        },
        { status: 403 }
      )
    }

    return handler(request, user)
  }
}
