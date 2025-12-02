/**
 * Purchase & Purchase Payment Type Definitions
 */

import { z } from 'zod'

import type { BaseEntity, PaymentMode, TransactionStatus } from './commonTypes'
import type { Supplier } from './supplierTypes'
import type { RawMaterial } from './rawMaterialTypes'

// ============================================
// INTERFACES
// ============================================

export interface Purchase extends BaseEntity {
  supplierId: string
  rawMaterialId: string
  quantity: number
  totalAmount: number
  amountPaid: number
  balance: number
  purchaseDate: Date
  status: TransactionStatus
}

export interface PurchasePayment extends BaseEntity {
  purchaseId: string
  amount: number
  paymentDate: Date
  paymentMode: PaymentMode
  notes: string | null
}

export interface PurchaseWithRelations extends Purchase {
  supplier: Supplier
  rawMaterial: RawMaterial
  payments: PurchasePayment[]
}

export interface CreatePurchaseInput {
  supplierId: string
  rawMaterialId: string
  quantity: number
  totalAmount: number
  amountPaid: number
  purchaseDate: Date | string
}

export interface UpdatePurchaseInput {
  supplierId?: string
  rawMaterialId?: string
  quantity?: number
  totalAmount?: number
  amountPaid?: number
  purchaseDate?: Date | string
}

export interface CreatePurchasePaymentInput {
  purchaseId: string
  amount: number
  paymentDate: Date | string
  paymentMode: PaymentMode
  notes?: string
}

export interface PurchaseListItem extends Purchase {
  supplierName: string
  rawMaterialName: string
}

export interface PurchaseStatistics {
  totalPurchases: number
  totalCost: number
  totalOutstanding: number
  totalPaid: number
  averagePurchaseValue: number
}

export interface SupplierPayable {
  supplierId: string
  supplierCode: string
  supplierName: string
  totalPayable: number
  purchasesWithBalance: number
  oldestPurchaseDate: Date
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const createPurchaseSchema = z
  .object({
    supplierId: z.string().uuid('Invalid supplier ID'),
    rawMaterialId: z.string().uuid('Invalid raw material ID'),
    quantity: z
      .number()
      .positive('Quantity must be positive')
      .max(999999.99, 'Quantity too large'),
    totalAmount: z
      .number()
      .positive('Total amount must be positive')
      .max(999999999.99, 'Total amount too large'),
    amountPaid: z
      .number()
      .min(0, 'Amount paid cannot be negative')
      .max(999999999.99, 'Amount paid too large'),
    purchaseDate: z.coerce.date()
  })
  .refine(
    data => data.amountPaid <= data.totalAmount,
    {
      message: 'Amount paid cannot exceed total amount',
      path: ['amountPaid']
    }
  )

export const updatePurchaseSchema = z
  .object({
    supplierId: z.string().uuid('Invalid supplier ID').optional(),
    rawMaterialId: z.string().uuid('Invalid raw material ID').optional(),
    quantity: z
      .number()
      .positive('Quantity must be positive')
      .max(999999.99, 'Quantity too large')
      .optional(),
    totalAmount: z
      .number()
      .positive('Total amount must be positive')
      .max(999999999.99, 'Total amount too large')
      .optional(),
    amountPaid: z
      .number()
      .min(0, 'Amount paid cannot be negative')
      .max(999999999.99, 'Amount paid too large')
      .optional(),
    purchaseDate: z.coerce.date().optional()
  })
  .partial()

export const createPurchasePaymentSchema = z.object({
  purchaseId: z.string().uuid('Invalid purchase ID'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount too large'),
  paymentDate: z.coerce.date(),
  paymentMode: z.enum(['cash', 'transfer', 'pos', 'credit', 'others']),
  notes: z.string().max(500, 'Notes too long').optional().nullable()
})

// Filter and search schemas
export const purchaseFilterSchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  rawMaterialId: z.string().uuid().optional(),
  status: z.enum(['pending', 'partial', 'paid']).optional(),
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

export type PurchaseFilterParams = z.infer<typeof purchaseFilterSchema>
