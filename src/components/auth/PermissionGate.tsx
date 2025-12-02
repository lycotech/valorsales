/**
 * Higher-Order Component for Permission-Based Rendering
 * Wraps components to conditionally render based on permissions
 */

'use client'

import { type ComponentType, type ReactElement } from 'react'

import { usePermission } from '@/hooks/usePermissions'

import type { Resource, Action } from '@/lib/auth/permissions'

interface WithPermissionProps {
  fallback?: ReactElement | null
}

/**
 * HOC to wrap a component with permission check
 * Only renders the component if user has the required permission
 *
 * @param Component - Component to wrap
 * @param resource - Resource to check
 * @param action - Action to check
 * @returns Wrapped component with permission check
 *
 * @example
 * ```tsx
 * const ProtectedButton = withPermission(
 *   DeleteButton,
 *   'CUSTOMERS',
 *   'DELETE'
 * )
 *
 * // Usage
 * <ProtectedButton fallback={<span>No access</span>} />
 * ```
 */
export function withPermission<P extends object>(
  Component: ComponentType<P>,
  resource: Resource,
  action: Action
) {
  return function PermissionWrapper(props: P & WithPermissionProps) {
    const { fallback = null, ...componentProps } = props
    const hasAccess = usePermission(resource, action)

    if (!hasAccess) {
      return fallback
    }

    return <Component {...(componentProps as P)} />
  }
}

interface PermissionGateProps {
  resource: Resource
  action: Action
  children: ReactElement | ReactElement[]
  fallback?: ReactElement | null
}

/**
 * Component to conditionally render children based on permission
 *
 * @example
 * ```tsx
 * <PermissionGate resource="CUSTOMERS" action="DELETE">
 *   <DeleteButton />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  resource,
  action,
  children,
  fallback = null
}: PermissionGateProps) {
  const hasAccess = usePermission(resource, action)

  if (!hasAccess) {
    return fallback
  }

  return <>{children}</>
}

interface AnyPermissionGateProps {
  permissions: Array<{ resource: Resource; action: Action }>
  children: ReactElement | ReactElement[]
  fallback?: ReactElement | null
}

/**
 * Component to conditionally render children if user has ANY of the permissions
 *
 * @example
 * ```tsx
 * <AnyPermissionGate
 *   permissions={[
 *     { resource: 'CUSTOMERS', action: 'CREATE' },
 *     { resource: 'CUSTOMERS', action: 'UPDATE' }
 *   ]}
 * >
 *   <CustomerForm />
 * </AnyPermissionGate>
 * ```
 */
export function AnyPermissionGate({
  permissions,
  children,
  fallback = null
}: AnyPermissionGateProps) {
  const hasAccess = permissions.some(({ resource, action }) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePermission(resource, action)
  )

  if (!hasAccess) {
    return fallback
  }

  return <>{children}</>
}

interface AllPermissionsGateProps {
  permissions: Array<{ resource: Resource; action: Action }>
  children: ReactElement | ReactElement[]
  fallback?: ReactElement | null
}

/**
 * Component to conditionally render children if user has ALL of the permissions
 *
 * @example
 * ```tsx
 * <AllPermissionsGate
 *   permissions={[
 *     { resource: 'REPORTS', action: 'READ' },
 *     { resource: 'REPORTS', action: 'EXPORT' }
 *   ]}
 * >
 *   <ExportReportButton />
 * </AllPermissionsGate>
 * ```
 */
export function AllPermissionsGate({
  permissions,
  children,
  fallback = null
}: AllPermissionsGateProps) {
  const hasAccess = permissions.every(({ resource, action }) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePermission(resource, action)
  )

  if (!hasAccess) {
    return fallback
  }

  return <>{children}</>
}
