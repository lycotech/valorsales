/**
 * Supplier & Supplier Items Type Definitions
 */

import { z } from 'zod'

import type { BaseEntity } from './commonTypes'

// ============================================
// INTERFACES
// ============================================

export interface Supplier extends BaseEntity {
  supplierCode: string
  name: string
  address: string
  phone: string
  location: string
}

export interface SupplierItem extends BaseEntity {
  itemCode: string
  itemName: string
  supplierId: string
}

export interface SupplierWithItems extends Supplier {
  items: SupplierItem[]
}

export interface CreateSupplierInput {
  name: string
  address: string
  phone: string
  location: string
  items?: Array<{
    itemName: string
  }>
}

export interface UpdateSupplierInput {
  name?: string
  address?: string
  phone?: string
  location?: string
}

export interface CreateSupplierItemInput {
  itemName: string
  supplierId: string
}

export interface UpdateSupplierItemInput {
  itemName?: string
}

export interface SupplierWithStats extends SupplierWithItems {
  totalPurchases: number
  totalOutstanding: number
  lastPurchaseDate: Date | null
}

export interface SupplierListItem extends Supplier {
  itemCount: number
  purchaseCount: number
  outstandingBalance: number
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const createSupplierItemSchema = z.object({
  itemName: z
    .string()
    .min(1, 'Item name is required')
    .min(2, 'Item name must be at least 2 characters')
    .max(255, 'Item name too long')
    .trim()
})

export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Supplier name is required')
    .min(2, 'Supplier name must be at least 2 characters')
    .max(255, 'Supplier name too long')
    .trim(),
  address: z
    .string()
    .min(1, 'Address is required')
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address too long')
    .trim(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number too long')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
    .trim(),
  location: z
    .string()
    .min(1, 'Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(255, 'Location too long')
    .trim(),
  items: z
    .array(createSupplierItemSchema)
    .optional()
    .default([])
})

export const updateSupplierSchema = z.object({
  name: z
    .string()
    .min(2, 'Supplier name must be at least 2 characters')
    .max(255, 'Supplier name too long')
    .trim()
    .optional(),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address too long')
    .trim()
    .optional(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number too long')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
    .trim()
    .optional(),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(255, 'Location too long')
    .trim()
    .optional()
})

export const updateSupplierItemSchema = z.object({
  itemName: z
    .string()
    .min(2, 'Item name must be at least 2 characters')
    .max(255, 'Item name too long')
    .trim()
    .optional()
})

// Filter and search schemas
export const supplierFilterSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  hasOutstanding: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10)
})

// ============================================
// TYPE EXPORTS
// ============================================

export type SupplierFilterParams = z.infer<typeof supplierFilterSchema>
