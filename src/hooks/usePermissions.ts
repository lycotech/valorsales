/**
 * React Hooks for Permission Checking
 * Client-side permission utilities for components
 */

'use client'

import { useSession } from '@/lib/auth/session-client'
import { hasPermission, Action, type Resource } from '@/lib/auth/permissions'

/**
 * Hook to check if current user has a specific permission
 * @param resource - Resource to check
 * @param action - Action to check
 * @returns True if user has permission, false otherwise
 */
export function usePermission(resource: Resource, action: Action): boolean {
  const { user } = useSession()

  if (!user) {
    return false
  }

  return hasPermission(user.role, resource, action)
}

/**
 * Hook to check multiple permissions (at least one required)
 * @param permissions - Array of resource-action pairs
 * @returns True if user has at least one permission, false otherwise
 */
export function useAnyPermission(
  permissions: Array<{ resource: Resource; action: Action }>
): boolean {
  const { user } = useSession()

  if (!user) {
    return false
  }

  return permissions.some(({ resource, action }) =>
    hasPermission(user.role, resource, action)
  )
}

/**
 * Hook to check multiple permissions (all required)
 * @param permissions - Array of resource-action pairs
 * @returns True if user has all permissions, false otherwise
 */
export function useAllPermissions(
  permissions: Array<{ resource: Resource; action: Action }>
): boolean {
  const { user } = useSession()

  if (!user) {
    return false
  }

  return permissions.every(({ resource, action }) =>
    hasPermission(user.role, resource, action)
  )
}

/**
 * Hook to get all allowed actions for a resource
 * @param resource - Resource to check
 * @returns Array of allowed actions
 */
export function useAllowedActions(resource: Resource): Action[] {
  const { user } = useSession()

  if (!user) {
    return []
  }

  const { getAllowedActions } = require('./permissions')

  return getAllowedActions(user.role, resource)
}

/**
 * Hook to check if user can create a resource
 * @param resource - Resource to check
 * @returns True if user can create, false otherwise
 */
export function useCanCreate(resource: Resource): boolean {
  return usePermission(resource, Action.CREATE)
}

/**
 * Hook to check if user can read a resource
 * @param resource - Resource to check
 * @returns True if user can read, false otherwise
 */
export function useCanRead(resource: Resource): boolean {
  return usePermission(resource, Action.READ)
}

/**
 * Hook to check if user can update a resource
 * @param resource - Resource to check
 * @returns True if user can update, false otherwise
 */
export function useCanUpdate(resource: Resource): boolean {
  return usePermission(resource, Action.UPDATE)
}

/**
 * Hook to check if user can delete a resource
 * @param resource - Resource to check
 * @returns True if user can delete, false otherwise
 */
export function useCanDelete(resource: Resource): boolean {
  return usePermission(resource, Action.DELETE)
}

/**
 * Hook to check if user can export a resource
 * @param resource - Resource to check
 * @returns True if user can export, false otherwise
 */
export function useCanExport(resource: Resource): boolean {
  return usePermission(resource, Action.EXPORT)
}

/**
 * Hook to check if user can manage a resource
 * @param resource - Resource to check
 * @returns True if user can manage, false otherwise
 */
export function useCanManage(resource: Resource): boolean {
  return usePermission(resource, Action.MANAGE)
}
