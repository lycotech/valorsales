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

export interface Sale extends BaseEntity {
  customerId: string
  productId: string
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
  product: Product
  payments: SalePayment[]
}

export interface CreateSaleInput {
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

export const createSaleSchema = z
  .object({
    customerId: z.string().uuid('Invalid customer ID'),
    productId: z.string().uuid('Invalid product ID'),
    quantity: z
      .number()
      .positive('Quantity must be positive')
      .max(999999.99, 'Quantity too large'),
    price: z
      .number()
      .positive('Price must be positive')
      .max(999999999.99, 'Price too large'),
    supplyDate: z.coerce.date(),
    paymentMode: paymentModeSchema,
    amountPaid: z
      .number()
      .min(0, 'Amount paid cannot be negative')
      .max(999999999.99, 'Amount paid too large'),
    paymentDate: z.coerce.date().optional().nullable()
  })
  .refine(
    data => {
      const total = data.quantity * data.price

      return data.amountPaid <= total
    },
    {
      message: 'Amount paid cannot exceed total amount',
      path: ['amountPaid']
    }
  )
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
