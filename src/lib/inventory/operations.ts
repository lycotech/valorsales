/**
 * Inventory Management Utilities
 * Handles stock calculations, transactions, and inventory operations
 */

import type { Decimal } from '@prisma/client/runtime/library'

import { prisma } from '@/lib/db/client'
import { StockStatus, TransactionType } from '@/types/inventoryTypes'

// ============================================
// STOCK STATUS HELPERS
// ============================================

/**
 * Calculate stock status based on current quantity and thresholds
 */
export function calculateStockStatus(
  quantity: number | Decimal,
  minimumStock: number | Decimal,
  maximumStock?: number | Decimal | null,
  reorderPoint?: number | Decimal
): StockStatus {
  const qty = typeof quantity === 'number' ? quantity : Number(quantity)
  const minStock = typeof minimumStock === 'number' ? minimumStock : Number(minimumStock)
  const maxStock = maximumStock ? (typeof maximumStock === 'number' ? maximumStock : Number(maximumStock)) : null
  const reorder = reorderPoint ? (typeof reorderPoint === 'number' ? reorderPoint : Number(reorderPoint)) : minStock

  if (qty === 0) {
    return StockStatus.OUT_OF_STOCK
  }

  if (qty <= reorder) {
    return StockStatus.LOW_STOCK
  }

  if (maxStock && qty > maxStock) {
    return StockStatus.OVERSTOCK
  }

  return StockStatus.IN_STOCK
}

// ============================================
// PRODUCT INVENTORY OPERATIONS
// ============================================

/**
 * Get or create product inventory record
 */
export async function getOrCreateProductInventory(productId: string) {
  let inventory = await prisma.productInventory.findUnique({
    where: { productId },
    include: { product: true }
  })

  if (!inventory) {
    inventory = await prisma.productInventory.create({
      data: {
        productId,
        quantity: 0,
        minimumStock: 0,
        reorderPoint: 0,
        unit: 'pcs'
      },
      include: { product: true }
    })
  }

  return inventory
}

/**
 * Deduct product stock (for sales)
 */
export async function deductProductStock(
  productId: string,
  quantity: number,
  saleId: string,
  userId?: string
) {
  return await prisma.$transaction(async tx => {
    // Get current inventory
    const inventory = await tx.productInventory.findUnique({
      where: { productId }
    })

    if (!inventory) {
      throw new Error('Product inventory not found')
    }

    const currentQty = Number(inventory.quantity)
    const deductQty = Number(quantity)

    // Check if sufficient stock
    if (currentQty < deductQty) {
      throw new Error(`Insufficient stock. Available: ${currentQty}, Required: ${deductQty}`)
    }

    const newQty = currentQty - deductQty

    // Update inventory
    const updatedInventory = await tx.productInventory.update({
      where: { productId },
      data: { quantity: newQty }
    })

    // Create transaction record
    await tx.inventoryTransaction.create({
      data: {
        type: 'product',
        productInventoryId: inventory.id,
        transactionType: TransactionType.SALE,
        quantityChange: -deductQty,
        quantityBefore: currentQty,
        quantityAfter: newQty,
        referenceId: saleId,
        referenceType: 'sale',
        notes: `Stock deducted for sale ${saleId}`,
        createdBy: userId
      }
    })

    return updatedInventory
  })
}

/**
 * Add product stock (for returns or adjustments)
 */
export async function addProductStock(
  productId: string,
  quantity: number,
  transactionType: TransactionType,
  referenceId?: string,
  notes?: string,
  userId?: string
) {
  return await prisma.$transaction(async tx => {
    const inventory = await tx.productInventory.findUnique({
      where: { productId }
    })

    if (!inventory) {
      throw new Error('Product inventory not found')
    }

    const currentQty = Number(inventory.quantity)
    const addQty = Number(quantity)
    const newQty = currentQty + addQty

    // Update inventory
    const updatedInventory = await tx.productInventory.update({
      where: { productId },
      data: {
        quantity: newQty,
        lastRestockedAt: new Date()
      }
    })

    // Create transaction record
    await tx.inventoryTransaction.create({
      data: {
        type: 'product',
        productInventoryId: inventory.id,
        transactionType,
        quantityChange: addQty,
        quantityBefore: currentQty,
        quantityAfter: newQty,
        referenceId,
        referenceType: transactionType.toLowerCase(),
        notes: notes || `Stock added via ${transactionType}`,
        createdBy: userId
      }
    })

    return updatedInventory
  })
}

// ============================================
// RAW MATERIAL INVENTORY OPERATIONS
// ============================================

/**
 * Get or create raw material inventory record
 */
export async function getOrCreateRawMaterialInventory(rawMaterialId: string) {
  let inventory = await prisma.rawMaterialInventory.findUnique({
    where: { rawMaterialId },
    include: { rawMaterial: true }
  })

  if (!inventory) {
    inventory = await prisma.rawMaterialInventory.create({
      data: {
        rawMaterialId,
        quantity: 0,
        minimumStock: 0,
        reorderPoint: 0,
        unit: 'kg'
      },
      include: { rawMaterial: true }
    })
  }

  return inventory
}

/**
 * Add raw material stock (for purchases)
 */
export async function addRawMaterialStock(
  rawMaterialId: string,
  quantity: number,
  purchaseId: string,
  userId?: string
) {
  return await prisma.$transaction(async tx => {
    const inventory = await tx.rawMaterialInventory.findUnique({
      where: { rawMaterialId }
    })

    if (!inventory) {
      throw new Error('Raw material inventory not found')
    }

    const currentQty = Number(inventory.quantity)
    const addQty = Number(quantity)
    const newQty = currentQty + addQty

    // Update inventory
    const updatedInventory = await tx.rawMaterialInventory.update({
      where: { rawMaterialId },
      data: {
        quantity: newQty,
        lastRestockedAt: new Date()
      }
    })

    // Create transaction record
    await tx.inventoryTransaction.create({
      data: {
        type: 'raw_material',
        rawMaterialInventoryId: inventory.id,
        transactionType: TransactionType.PURCHASE,
        quantityChange: addQty,
        quantityBefore: currentQty,
        quantityAfter: newQty,
        referenceId: purchaseId,
        referenceType: 'purchase',
        notes: `Stock added from purchase ${purchaseId}`,
        createdBy: userId
      }
    })

    return updatedInventory
  })
}

/**
 * Deduct raw material stock (for usage or adjustments)
 */
export async function deductRawMaterialStock(
  rawMaterialId: string,
  quantity: number,
  transactionType: TransactionType,
  referenceId?: string,
  notes?: string,
  userId?: string
) {
  return await prisma.$transaction(async tx => {
    const inventory = await tx.rawMaterialInventory.findUnique({
      where: { rawMaterialId }
    })

    if (!inventory) {
      throw new Error('Raw material inventory not found')
    }

    const currentQty = Number(inventory.quantity)
    const deductQty = Number(quantity)

    // Check if sufficient stock
    if (currentQty < deductQty) {
      throw new Error(`Insufficient stock. Available: ${currentQty}, Required: ${deductQty}`)
    }

    const newQty = currentQty - deductQty

    // Update inventory
    const updatedInventory = await tx.rawMaterialInventory.update({
      where: { rawMaterialId },
      data: { quantity: newQty }
    })

    // Create transaction record
    await tx.inventoryTransaction.create({
      data: {
        type: 'raw_material',
        rawMaterialInventoryId: inventory.id,
        transactionType,
        quantityChange: -deductQty,
        quantityBefore: currentQty,
        quantityAfter: newQty,
        referenceId,
        referenceType: transactionType.toLowerCase(),
        notes: notes || `Stock deducted via ${transactionType}`,
        createdBy: userId
      }
    })

    return updatedInventory
  })
}

// ============================================
// INVENTORY ALERTS
// ============================================

/**
 * Get all low stock items
 */
export async function getLowStockItems() {
  const [lowStockProducts, lowStockMaterials] = await Promise.all([
    // Get low stock products
    prisma.productInventory.findMany({
      where: {
        OR: [
          { quantity: { lte: prisma.productInventory.fields.reorderPoint } },
          { quantity: 0 }
        ]
      },
      include: {
        product: true
      }
    }),

    // Get low stock raw materials
    prisma.rawMaterialInventory.findMany({
      where: {
        OR: [
          { quantity: { lte: prisma.rawMaterialInventory.fields.reorderPoint } },
          { quantity: 0 }
        ]
      },
      include: {
        rawMaterial: true
      }
    })
  ])

  return {
    products: lowStockProducts,
    rawMaterials: lowStockMaterials,
    totalAlerts: lowStockProducts.length + lowStockMaterials.length
  }
}
