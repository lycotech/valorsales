/**
 * Report Type Definitions
 */

import { z } from 'zod'

import type { DateRangeFilter, ExportOptions, PaymentMode } from './commonTypes'

// ============================================
// REPORT INTERFACES
// ============================================

// Customer Report
export interface CustomerReportItem {
  id: string
  customerCode: string
  businessName: string
  address: string
  phone: string
  location: string
  totalSales: number
  totalRevenue: number
  outstandingBalance: number
  lastSaleDate: Date | null
}

export interface CustomerReportSummary {
  totalCustomers: number
  totalRevenue: number
  totalOutstanding: number
  activeCustomers: number
}

// Supplier Report
export interface SupplierReportItem {
  id: string
  supplierCode: string
  name: string
  address: string
  phone: string
  location: string
  items: Array<{
    itemCode: string
    itemName: string
  }>
  totalPurchases: number
  totalCost: number
  outstandingPayable: number
  lastPurchaseDate: Date | null
}

export interface SupplierReportSummary {
  totalSuppliers: number
  totalCost: number
  totalOutstanding: number
  activeSuppliers: number
}

// Outstanding Receivables Report
export interface OutstandingReceivableItem {
  saleId: string
  customerId: string
  customerCode: string
  customerName: string
  productName: string
  saleDate: Date
  totalAmount: number
  amountPaid: number
  balance: number
  daysOutstanding: number
  status: string
}

export interface OutstandingReceivablesSummary {
  totalOutstanding: number
  numberOfCustomers: number
  numberOfSales: number
  aging: {
    current: number // 0-30 days
    thirtyToSixty: number // 31-60 days
    sixtyToNinety: number // 61-90 days
    overNinety: number // 90+ days
  }
}

// Outstanding Payables Report
export interface OutstandingPayableItem {
  purchaseId: string
  supplierId: string
  supplierCode: string
  supplierName: string
  rawMaterialName: string
  purchaseDate: Date
  totalAmount: number
  amountPaid: number
  balance: number
  daysOutstanding: number
  status: string
}

export interface OutstandingPayablesSummary {
  totalOutstanding: number
  numberOfSuppliers: number
  numberOfPurchases: number
  aging: {
    current: number // 0-30 days
    thirtyToSixty: number // 31-60 days
    sixtyToNinety: number // 61-90 days
    overNinety: number // 90+ days
  }
}

// Sales by Product Report
export interface SalesByProductItem {
  productId: string
  productCode: string
  productName: string
  totalQuantitySold: number
  totalRevenue: number
  numberOfSales: number
  averagePrice: number
  lastSaleDate: Date | null
}

export interface SalesByProductSummary {
  totalProducts: number
  totalRevenue: number
  totalQuantitySold: number
  totalSales: number
}

// Total Sales Report
export interface TotalSalesItem {
  date: Date
  numberOfSales: number
  totalRevenue: number
  totalAmountPaid: number
  totalBalance: number
  cashSales: number
  creditSales: number
  transferSales: number
  posSales: number
  otherSales: number
}

export interface TotalSalesSummary {
  totalRevenue: number
  totalSales: number
  totalPaid: number
  totalOutstanding: number
  averageSaleValue: number
  paymentModeBreakdown: {
    cash: number
    transfer: number
    pos: number
    credit: number
    others: number
  }
}

// ============================================
// REPORT REQUEST INTERFACES
// ============================================

export interface CustomerReportRequest extends DateRangeFilter {
  location?: string
  hasOutstanding?: boolean
  export?: ExportOptions
}

export interface SupplierReportRequest extends DateRangeFilter {
  location?: string
  hasOutstanding?: boolean
  export?: ExportOptions
}

export interface OutstandingReceivablesRequest extends DateRangeFilter {
  customerId?: string
  minAmount?: number
  export?: ExportOptions
}

export interface OutstandingPayablesRequest extends DateRangeFilter {
  supplierId?: string
  minAmount?: number
  export?: ExportOptions
}

export interface SalesByProductRequest extends DateRangeFilter {
  productId?: string
  minQuantity?: number
  export?: ExportOptions
}

export interface TotalSalesRequest extends DateRangeFilter {
  groupBy?: 'day' | 'week' | 'month' | 'year'
  paymentMode?: PaymentMode
  customerId?: string
  export?: ExportOptions
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const exportOptionsSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv']),
  filename: z.string().optional(),
  includeHeaders: z.boolean().optional().default(true)
})

export const customerReportRequestSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  hasOutstanding: z.boolean().optional(),
  export: exportOptionsSchema.optional()
})

export const supplierReportRequestSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  hasOutstanding: z.boolean().optional(),
  export: exportOptionsSchema.optional()
})

export const outstandingReceivablesRequestSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  customerId: z.string().uuid().optional(),
  minAmount: z.number().positive().optional(),
  export: exportOptionsSchema.optional()
})

export const outstandingPayablesRequestSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  supplierId: z.string().uuid().optional(),
  minAmount: z.number().positive().optional(),
  export: exportOptionsSchema.optional()
})

export const salesByProductRequestSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  productId: z.string().uuid().optional(),
  minQuantity: z.number().positive().optional(),
  export: exportOptionsSchema.optional()
})

export const totalSalesRequestSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year']).optional().default('day'),
  paymentMode: z.enum(['cash', 'transfer', 'pos', 'credit', 'others']).optional(),
  customerId: z.string().uuid().optional(),
  export: exportOptionsSchema.optional()
})

// ============================================
// TYPE EXPORTS
// ============================================

export type CustomerReportFilters = z.infer<typeof customerReportRequestSchema>
export type SupplierReportFilters = z.infer<typeof supplierReportRequestSchema>
export type OutstandingReceivablesFilters = z.infer<typeof outstandingReceivablesRequestSchema>
export type OutstandingPayablesFilters = z.infer<typeof outstandingPayablesRequestSchema>
export type SalesByProductFilters = z.infer<typeof salesByProductRequestSchema>
export type TotalSalesFilters = z.infer<typeof totalSalesRequestSchema>
