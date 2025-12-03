/**
 * Role-Based Access Control (RBAC) Permissions System
 * Defines permissions for each user role
 */

import { UserRole } from '@/types'

/**
 * Resource types in the system
 */
export enum Resource {

  // Master Data
  CUSTOMERS = 'customers',
  SUPPLIERS = 'suppliers',
  PRODUCTS = 'products',
  RAW_MATERIALS = 'raw_materials',

  // Transactions
  SALES = 'sales',
  PURCHASES = 'purchases',

  // Inventory
  INVENTORY = 'inventory',

  // Reports
  REPORTS = 'reports',

  // User Management
  USERS = 'users',

  // Dashboard
  DASHBOARD = 'dashboard'
}

/**
 * Permission actions
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  MANAGE = 'manage' // Full access (all CRUD operations)
}

/**
 * Permission definition
 */
export interface Permission {
  resource: Resource
  actions: Action[]
}

/**
 * Role-based permissions configuration
 * Defines what each role can do with each resource
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Admin has full access to everything
  [UserRole.ADMIN]: [
    { resource: Resource.CUSTOMERS, actions: [Action.MANAGE] },
    { resource: Resource.SUPPLIERS, actions: [Action.MANAGE] },
    { resource: Resource.PRODUCTS, actions: [Action.MANAGE] },
    { resource: Resource.RAW_MATERIALS, actions: [Action.MANAGE] },
    { resource: Resource.SALES, actions: [Action.MANAGE] },
    { resource: Resource.PURCHASES, actions: [Action.MANAGE] },
    { resource: Resource.INVENTORY, actions: [Action.MANAGE] },
    { resource: Resource.REPORTS, actions: [Action.MANAGE] },
    { resource: Resource.USERS, actions: [Action.MANAGE] },
    { resource: Resource.DASHBOARD, actions: [Action.READ] }
  ],

  // Sales Officer: Full access to sales and customers, read-only inventory
  [UserRole.SALES]: [
    { resource: Resource.CUSTOMERS, actions: [Action.CREATE, Action.READ, Action.UPDATE] },
    { resource: Resource.PRODUCTS, actions: [Action.READ] },
    { resource: Resource.SALES, actions: [Action.CREATE, Action.READ, Action.UPDATE] },
    { resource: Resource.INVENTORY, actions: [Action.READ] },
    { resource: Resource.REPORTS, actions: [Action.READ, Action.EXPORT] },
    { resource: Resource.DASHBOARD, actions: [Action.READ] }
  ],

  // Procurement Officer: Full access to suppliers and raw materials, manage inventory
  [UserRole.PROCUREMENT]: [
    { resource: Resource.SUPPLIERS, actions: [Action.CREATE, Action.READ, Action.UPDATE] },
    { resource: Resource.RAW_MATERIALS, actions: [Action.CREATE, Action.READ, Action.UPDATE] },
    { resource: Resource.PURCHASES, actions: [Action.CREATE, Action.READ, Action.UPDATE] },
    { resource: Resource.INVENTORY, actions: [Action.CREATE, Action.READ, Action.UPDATE] },
    { resource: Resource.PRODUCTS, actions: [Action.READ] },
    { resource: Resource.REPORTS, actions: [Action.READ, Action.EXPORT] },
    { resource: Resource.DASHBOARD, actions: [Action.READ] }
  ],

  // Management: Read-only access to reports and dashboard
  [UserRole.MANAGEMENT]: [
    { resource: Resource.CUSTOMERS, actions: [Action.READ] },
    { resource: Resource.SUPPLIERS, actions: [Action.READ] },
    { resource: Resource.PRODUCTS, actions: [Action.READ] },
    { resource: Resource.RAW_MATERIALS, actions: [Action.READ] },
    { resource: Resource.SALES, actions: [Action.READ] },
    { resource: Resource.PURCHASES, actions: [Action.READ] },
    { resource: Resource.INVENTORY, actions: [Action.READ] },
    { resource: Resource.REPORTS, actions: [Action.READ, Action.EXPORT] },
    { resource: Resource.DASHBOARD, actions: [Action.READ] }
  ]
}

/**
 * Check if a role has permission for a specific action on a resource
 * @param role - User role
 * @param resource - Resource to check
 * @param action - Action to check
 * @returns True if the role has permission
 */
export function hasPermission(
  role: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const permissions = ROLE_PERMISSIONS[role]

  if (!permissions) {
    return false
  }

  // Find the permission for the resource
  const resourcePermission = permissions.find(p => p.resource === resource)

  if (!resourcePermission) {
    return false
  }

  // Check if the action is allowed or if MANAGE permission exists
  return (
    resourcePermission.actions.includes(action) ||
    resourcePermission.actions.includes(Action.MANAGE)
  )
}

/**
 * Check if a role can create a resource
 */
export function canCreate(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, Action.CREATE)
}

/**
 * Check if a role can read a resource
 */
export function canRead(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, Action.READ)
}

/**
 * Check if a role can update a resource
 */
export function canUpdate(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, Action.UPDATE)
}

/**
 * Check if a role can delete a resource
 */
export function canDelete(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, Action.DELETE)
}

/**
 * Check if a role can export a resource
 */
export function canExport(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, Action.EXPORT)
}

/**
 * Check if a role has full access (manage) to a resource
 */
export function canManage(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, Action.MANAGE)
}

/**
 * Get all permissions for a role
 * @param role - User role
 * @returns Array of permissions
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Get all actions allowed for a role on a specific resource
 * @param role - User role
 * @param resource - Resource to check
 * @returns Array of allowed actions
 */
export function getAllowedActions(role: UserRole, resource: Resource): Action[] {
  const permissions = ROLE_PERMISSIONS[role]

  if (!permissions) {
    return []
  }

  const resourcePermission = permissions.find(p => p.resource === resource)

  if (!resourcePermission) {
    return []
  }

  // If MANAGE permission exists, return all actions
  if (resourcePermission.actions.includes(Action.MANAGE)) {
    return [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT]
  }

  return resourcePermission.actions
}
