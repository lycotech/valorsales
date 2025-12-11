/**
 * Audit Logger - Utility for creating audit log entries
 */

import { prisma } from '@/lib/db/client'

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export'

export type AuditEntity =
  | 'customer'
  | 'product'
  | 'raw_material'
  | 'supplier'
  | 'sale'
  | 'purchase'
  | 'payment'
  | 'user'
  | 'inventory'
  | 'system'

export interface AuditLogData {
  userId: string
  action: AuditAction
  entity: AuditEntity
  entityId: string
  oldValue?: Record<string, any> | null
  newValue?: Record<string, any> | null
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue ? JSON.parse(JSON.stringify(data.oldValue)) : undefined,
        newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : undefined,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent ? data.userAgent.substring(0, 500) : null
      }
    })
  } catch (error) {
    // Don't throw - audit logging should not break the main operation
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Log a CREATE action
 */
export async function logCreate(
  entity: AuditEntity,
  entityId: string,
  newValue: Record<string, any>,
  userId: string,
  options?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'create',
    entity,
    entityId,
    newValue: sanitizeForLog(newValue),
    ...options
  })
}

/**
 * Log an UPDATE action
 */
export async function logUpdate(
  entity: AuditEntity,
  entityId: string,
  oldValue: Record<string, any>,
  newValue: Record<string, any>,
  userId: string,
  options?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  // Only log the fields that changed
  const changes = getChangedFields(oldValue, newValue)

  if (Object.keys(changes.old).length === 0) {
    return // No changes to log
  }

  await createAuditLog({
    userId,
    action: 'update',
    entity,
    entityId,
    oldValue: changes.old,
    newValue: changes.new,
    ...options
  })
}

/**
 * Log a DELETE action
 */
export async function logDelete(
  entity: AuditEntity,
  entityId: string,
  oldValue: Record<string, any>,
  userId: string,
  options?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'delete',
    entity,
    entityId,
    oldValue: sanitizeForLog(oldValue),
    ...options
  })
}

/**
 * Log a LOGIN action
 */
export async function logLogin(userId: string, options?: { ipAddress?: string; userAgent?: string }): Promise<void> {
  await createAuditLog({
    userId,
    action: 'login',
    entity: 'user',
    entityId: userId,
    ...options
  })
}

/**
 * Log a LOGOUT action
 */
export async function logLogout(userId: string, options?: { ipAddress?: string; userAgent?: string }): Promise<void> {
  await createAuditLog({
    userId,
    action: 'logout',
    entity: 'user',
    entityId: userId,
    ...options
  })
}

/**
 * Log an EXPORT action
 */
export async function logExport(
  entity: AuditEntity,
  userId: string,
  details?: Record<string, any>,
  options?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'export',
    entity,
    entityId: 'bulk',
    newValue: details || null,
    ...options
  })
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get only the fields that changed between old and new values
 */
function getChangedFields(
  oldValue: Record<string, any>,
  newValue: Record<string, any>
): { old: Record<string, any>; new: Record<string, any> } {
  const oldChanges: Record<string, any> = {}
  const newChanges: Record<string, any> = {}

  const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])

  for (const key of allKeys) {
    // Skip internal fields
    if (['createdAt', 'updatedAt', 'password'].includes(key)) continue

    const oldVal = oldValue[key]
    const newVal = newValue[key]

    // Compare values (handle objects, arrays, etc.)
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      oldChanges[key] = oldVal
      newChanges[key] = newVal
    }
  }

  return { old: oldChanges, new: newChanges }
}

/**
 * Sanitize data for logging (remove sensitive fields)
 */
function sanitizeForLog(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data }

  // Remove sensitive fields
  delete sanitized.password
  delete sanitized.token
  delete sanitized.refreshToken

  // Convert Decimal/BigInt to string for JSON serialization
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'bigint') {
      sanitized[key] = sanitized[key].toString()
    } else if (sanitized[key]?.constructor?.name === 'Decimal') {
      sanitized[key] = sanitized[key].toString()
    }
  }

  return sanitized
}

/**
 * Get request details from headers (for use in API routes)
 */
export function getRequestDetails(request: Request): { ipAddress: string; userAgent: string } {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'

  const userAgent = request.headers.get('user-agent') || 'unknown'

  return { ipAddress, userAgent }
}
