/**
 * Inventory Management Types
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export enum InventoryType {
  PRODUCT = 'product',
  RAW_MATERIAL = 'raw_material'
}

export enum TransactionType {
  SALE = 'sale',
  PURCHASE = 'purchase',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  TRANSFER = 'transfer'
}

export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  OVERSTOCK = 'overstock'
}

// ============================================
// ZOD SCHEMAS
// ============================================

export const productInventorySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().min(0),
  minimumStock: z.number().min(0).default(0),
  maximumStock: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).default(0),
  unit: z.string().default('pcs')
})

export const rawMaterialInventorySchema = z.object({
  rawMaterialId: z.string().uuid(),
  quantity: z.number().min(0),
  minimumStock: z.number().min(0).default(0),
  maximumStock: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).default(0),
  unit: z.string().default('kg')
})

export const inventoryAdjustmentSchema = z.object({
  type: z.enum(['product', 'raw_material']),
  itemId: z.string().uuid(),
  quantityChange: z.number(), // Positive for add, negative for remove
  notes: z.string().optional()
})

export const stockTransferSchema = z.object({
  fromItemId: z.string().uuid(),
  toItemId: z.string().uuid(),
  quantity: z.number().min(0.01),
  notes: z.string().optional()
})

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type ProductInventoryInput = z.infer<typeof productInventorySchema>
export type RawMaterialInventoryInput = z.infer<typeof rawMaterialInventorySchema>
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>
export type StockTransferInput = z.infer<typeof stockTransferSchema>

export interface InventoryTransactionRecord {
  id: string
  type: InventoryType
  transactionType: TransactionType
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  referenceId?: string
  referenceType?: string
  notes?: string
  createdBy?: string
  createdAt: Date
}

export interface ProductInventoryDetails {
  id: string
  productId: string
  productCode: string
  productName: string
  quantity: number
  minimumStock: number
  maximumStock?: number
  reorderPoint: number
  unit: string
  status: StockStatus
  lastRestockedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface RawMaterialInventoryDetails {
  id: string
  rawMaterialId: string
  materialCode: string
  materialName: string
  quantity: number
  minimumStock: number
  maximumStock?: number
  reorderPoint: number
  unit: string
  status: StockStatus
  lastRestockedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface InventoryAlert {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  type: InventoryType
  currentStock: number
  minimumStock: number
  reorderPoint: number
  status: StockStatus
  message: string
}
