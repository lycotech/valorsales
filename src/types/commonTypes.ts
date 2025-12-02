/**
 * Common Types Used Across the Application
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  ADMIN = 'admin',
  SALES = 'sales',
  PROCUREMENT = 'procurement',
  MANAGEMENT = 'management'
}

export enum PaymentMode {
  CASH = 'cash',
  TRANSFER = 'transfer',
  POS = 'pos',
  CREDIT = 'credit',
  OTHERS = 'others'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid'
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export enum AuditEntity {
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier',
  PRODUCT = 'product',
  RAW_MATERIAL = 'raw_material',
  SALE = 'sale',
  PURCHASE = 'purchase',
  USER = 'user'
}

// ============================================
// COMMON INTERFACES
// ============================================

export interface TimestampFields {
  createdAt: Date
  updatedAt: Date
}

export interface BaseEntity extends TimestampFields {
  id: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DateRangeFilter {
  startDate?: Date | string
  endDate?: Date | string
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  filename?: string
  includeHeaders?: boolean
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
})

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
})

// ============================================
// UTILITY TYPES
// ============================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Form state types
export type FormMode = 'create' | 'edit' | 'view'

export interface FormState<T> {
  data: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  isValid: boolean
}
