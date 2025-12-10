/**
 * Sales & Sale Payment Type Definitions
 */

import { z } from 'zod'

import type { BaseEntity, PaymentMode, TransactionStatus } from './commonTypes'
import type { Customer } from './customerTypes'
import type { Product } from './productTypes'

// ============================================
// INTERFACES
// ============================================

export interface SaleItem extends BaseEntity {
  saleId: string
  productId: string
  quantity: number
  price: number
  subtotal: number
}

export interface SaleItemWithProduct extends SaleItem {
  product: Product
}

export interface Sale extends BaseEntity {
  saleCode: string
  customerId: string
  productId?: string | null  // Made optional for multi-product support
  quantity: number
  price: number
  total: number
  supplyDate: Date
  paymentMode: PaymentMode
  amountPaid: number
  balance: number
  paymentDate: Date | null
  status: TransactionStatus
}

export interface SalePayment extends BaseEntity {
  saleId: string
  amount: number
  paymentDate: Date
  paymentMode: PaymentMode
  notes: string | null
}

export interface SaleWithRelations extends Sale {
  customer: Customer
  product?: Product | null
  payments: SalePayment[]
  items: SaleItemWithProduct[]  // Added for multi-product support
}

// Input for each line item when creating multi-product sale
export interface SaleItemInput {
  productId: string
  quantity: number
  price: number
}

export interface CreateSaleInput {
  customerId: string
  items: SaleItemInput[]  // Multiple products
  supplyDate: Date | string
  paymentMode: PaymentMode
  amountPaid: number
  paymentDate?: Date | string | null
  useCreditBalance?: boolean  // Whether to use customer's credit balance
}

// Legacy single-product sale input (for backward compatibility)
export interface CreateSingleSaleInput {
  customerId: string
  productId: string
  quantity: number
  price: number
  supplyDate: Date | string
  paymentMode: PaymentMode
  amountPaid: number
  paymentDate?: Date | string | null
}

export interface UpdateSaleInput {
  customerId?: string
  productId?: string
  quantity?: number
  price?: number
  supplyDate?: Date | string
  paymentMode?: PaymentMode
  amountPaid?: number
  paymentDate?: Date | string | null
}

export interface CreateSalePaymentInput {
  saleId: string
  amount: number
  paymentDate: Date | string
  paymentMode: PaymentMode
  notes?: string
}

export interface SaleListItem extends Sale {
  customerName: string
  productName: string
}

export interface SaleStatistics {
  totalSales: number
  totalRevenue: number
  totalOutstanding: number
  totalPaid: number
  averageSaleValue: number
}

export interface CustomerOutstanding {
  customerId: string
  customerCode: string
  customerName: string
  totalOutstanding: number
  salesWithBalance: number
  oldestSaleDate: Date
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const paymentModeSchema = z.enum(['cash', 'transfer', 'pos', 'credit', 'others'])

export const transactionStatusSchema = z.enum(['pending', 'partial', 'paid'])

// Schema for individual sale item
export const saleItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z
    .number()
    .positive('Quantity must be positive')
    .max(999999.99, 'Quantity too large'),
  price: z
    .number()
    .positive('Price must be positive')
    .max(999999999.99, 'Price too large')
})

// Schema for multi-product sale
export const createSaleSchema = z
  .object({
    customerId: z.string().uuid('Invalid customer ID'),
    items: z.array(saleItemInputSchema).min(1, 'At least one product is required'),
    supplyDate: z.coerce.date(),
    paymentMode: paymentModeSchema,
    amountPaid: z
      .number()
      .min(0, 'Amount paid cannot be negative')
      .max(999999999.99, 'Amount paid too large'),
    paymentDate: z.coerce.date().optional().nullable(),
    useCreditBalance: z.boolean().optional().default(false)
  })
  .refine(
    data => {
      // If payment mode is credit and amount paid is less than total, payment date is optional
      // Otherwise, if amount paid > 0, payment date should be provided
      if (data.amountPaid > 0 && data.paymentMode !== 'credit') {
        return data.paymentDate !== null && data.paymentDate !== undefined
      }

      return true
    },
    {
      message: 'Payment date is required when amount is paid',
      path: ['paymentDate']
    }
  )

export const updateSaleSchema = z
  .object({
    customerId: z.string().uuid('Invalid customer ID').optional(),
    productId: z.string().uuid('Invalid product ID').optional(),
    quantity: z
      .number()
      .positive('Quantity must be positive')
      .max(999999.99, 'Quantity too large')
      .optional(),
    price: z
      .number()
      .positive('Price must be positive')
      .max(999999999.99, 'Price too large')
      .optional(),
    supplyDate: z.coerce.date().optional(),
    paymentMode: paymentModeSchema.optional(),
    amountPaid: z
      .number()
      .min(0, 'Amount paid cannot be negative')
      .max(999999999.99, 'Amount paid too large')
      .optional(),
    paymentDate: z.coerce.date().optional().nullable()
  })
  .partial()

export const createSalePaymentSchema = z.object({
  saleId: z.string().uuid('Invalid sale ID'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount too large'),
  paymentDate: z.coerce.date(),
  paymentMode: paymentModeSchema,
  notes: z.string().max(500, 'Notes too long').optional().nullable()
})

// Filter and search schemas
export const saleFilterSchema = z.object({
  search: z.string().optional(),
  customerId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  status: transactionStatusSchema.optional(),
  paymentMode: paymentModeSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10)
})

// ============================================
// TYPE EXPORTS
// ============================================

export type SaleFilterParams = z.infer<typeof saleFilterSchema>
