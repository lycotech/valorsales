/**
 * Customer Type Definitions
 */

import { z } from 'zod'

import type { BaseEntity } from './commonTypes'

// ============================================
// INTERFACES
// ============================================

export interface Customer extends BaseEntity {
  customerCode: string
  businessName: string
  phone: string
  location: string
  contactPerson?: string | null
  contactPersonPhone?: string | null
  creditBalance?: number
}

export interface CreateCustomerInput {
  businessName: string
  phone: string
  location: string
  contactPerson?: string
  contactPersonPhone?: string
}

export interface UpdateCustomerInput {
  businessName?: string
  phone?: string
  location?: string
  contactPerson?: string
  contactPersonPhone?: string
}

export interface CustomerWithStats extends Customer {
  totalSales: number
  totalOutstanding: number
  creditBalance: number
  lastSaleDate: Date | null
}

export interface CustomerListItem extends Customer {
  salesCount: number
  outstandingBalance: number
  creditBalance: number
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const createCustomerSchema = z.object({
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .min(2, 'Business name must be at least 2 characters')
    .max(255, 'Business name too long')
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
    .max(1000, 'Location too long')
    .trim(),
  contactPerson: z
    .string()
    .min(2, 'Contact person name must be at least 2 characters')
    .max(255, 'Contact person name too long')
    .trim()
    .optional(),
  contactPersonPhone: z
    .string()
    .min(10, 'Contact person phone must be at least 10 characters')
    .max(20, 'Contact person phone too long')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
    .trim()
    .optional()
})

export const updateCustomerSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(255, 'Business name too long')
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
    .max(1000, 'Location too long')
    .trim()
    .optional(),
  contactPerson: z
    .string()
    .min(2, 'Contact person name must be at least 2 characters')
    .max(255, 'Contact person name too long')
    .trim()
    .optional(),
  contactPersonPhone: z
    .string()
    .min(10, 'Contact person phone must be at least 10 characters')
    .max(20, 'Contact person phone too long')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
    .trim()
    .optional()
})

// Filter and search schemas
export const customerFilterSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  hasOutstanding: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10)
})

// ============================================
// TYPE EXPORTS
// ============================================

export type CustomerFilterParams = z.infer<typeof customerFilterSchema>
