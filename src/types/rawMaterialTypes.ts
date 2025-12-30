/**
 * Raw Material Type Definitions
 */

import { z } from 'zod'

import type { BaseEntity } from './commonTypes'

// ============================================
// INTERFACES
// ============================================

export interface RawMaterial extends BaseEntity {
  materialCode: string
  materialName: string
}

export interface CreateRawMaterialInput {
  materialName: string

  // Inventory settings
  initialStock?: number
  minimumStock?: number
  maximumStock?: number | null
  reorderPoint?: number
  unit?: string
}

export interface UpdateRawMaterialInput {
  materialName?: string
  // Inventory settings (can be updated)
  minimumStock?: number
  maximumStock?: number | null
  reorderPoint?: number
  unit?: string
}

export interface RawMaterialWithStats extends RawMaterial {
  totalPurchases: number
  totalQuantityPurchased: number
  totalCost: number
  lastPurchaseDate: Date | null
}

export interface RawMaterialListItem extends RawMaterial {
  purchaseCount: number
  totalCost: number
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const createRawMaterialSchema = z.object({
  materialName: z
    .string()
    .min(1, 'Material name is required')
    .min(2, 'Material name must be at least 2 characters')
    .max(255, 'Material name too long')
    .trim(),

  // Inventory settings
  initialStock: z
    .number()
    .min(0, 'Initial stock cannot be negative')
    .optional()
    .default(0),
  minimumStock: z
    .number()
    .min(0, 'Minimum stock cannot be negative')
    .optional()
    .default(50),
  maximumStock: z
    .number()
    .positive('Maximum stock must be positive')
    .optional()
    .nullable(),
  reorderPoint: z
    .number()
    .min(0, 'Reorder point cannot be negative')
    .optional()
    .default(100),
  unit: z
    .string()
    .max(20, 'Unit too long')
    .optional()
    .default('kg')
})

export const updateRawMaterialSchema = z.object({
  materialName: z
    .string()
    .min(2, 'Material name must be at least 2 characters')
    .max(255, 'Material name too long')
    .trim()
    .optional(),
  // Inventory settings
  minimumStock: z
    .number()
    .min(0, 'Minimum stock cannot be negative')
    .optional(),
  maximumStock: z
    .number()
    .positive('Maximum stock must be positive')
    .optional()
    .nullable(),
  reorderPoint: z
    .number()
    .min(0, 'Reorder point cannot be negative')
    .optional(),
  unit: z
    .string()
    .max(20, 'Unit too long')
    .optional()
})

// Filter and search schemas
export const rawMaterialFilterSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10)
})

// Bulk import schema
export const bulkRawMaterialImportSchema = z.array(
  z.object({
    materialName: z.string().min(1, 'Material name is required')
  })
)

// ============================================
// TYPE EXPORTS
// ============================================

export type RawMaterialFilterParams = z.infer<typeof rawMaterialFilterSchema>
export type BulkRawMaterialImport = z.infer<typeof bulkRawMaterialImportSchema>
