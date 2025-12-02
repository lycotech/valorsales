/**
 * Product Type Definitions
 */

import { z } from 'zod'

import type { BaseEntity } from './commonTypes'

// ============================================
// INTERFACES
// ============================================

export interface Product extends BaseEntity {
  productCode: string
  productName: string
  price: number | null
}

export interface CreateProductInput {
  productName: string
  price?: number | null
}

export interface UpdateProductInput {
  productName?: string
  price?: number | null
}

export interface ProductWithStats extends Product {
  totalSales: number
  totalQuantitySold: number
  totalRevenue: number
  lastSaleDate: Date | null
}

export interface ProductListItem extends Product {
  salesCount: number
  totalRevenue: number
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const createProductSchema = z.object({
  productName: z
    .string()
    .min(1, 'Product name is required')
    .min(2, 'Product name must be at least 2 characters')
    .max(255, 'Product name too long')
    .trim(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(999999999.99, 'Price too large')
    .optional()
    .nullable()
    .transform(val => val === undefined ? null : val)
})

export const updateProductSchema = z.object({
  productName: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(255, 'Product name too long')
    .trim()
    .optional(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(999999999.99, 'Price too large')
    .optional()
    .nullable()
})

// Filter and search schemas
export const productFilterSchema = z.object({
  search: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  hasPrice: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10)
})

// Bulk import schema
export const bulkProductImportSchema = z.array(
  z.object({
    productName: z.string().min(1, 'Product name is required'),
    price: z.number().positive().optional().nullable()
  })
)

// ============================================
// TYPE EXPORTS
// ============================================

export type ProductFilterParams = z.infer<typeof productFilterSchema>
export type BulkProductImport = z.infer<typeof bulkProductImportSchema>
