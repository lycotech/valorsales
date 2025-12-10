import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { z } from 'zod'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'
import { TransactionType } from '@/types/inventoryTypes'

// Validation schema for goods received
const goodsReceivedSchema = z.object({
  itemType: z.enum(['product', 'raw_material']),
  itemId: z.string().min(1, 'Item ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  referenceNumber: z.string().optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
  receivedDate: z.string().optional()
})

/**
 * Record goods received - add stock to inventory
 * POST /api/inventory/goods-received
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Check permissions - Admin and Procurement can receive goods
    if (!hasPermission(payload.role as any, Resource.INVENTORY, Action.UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = goodsReceivedSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { itemType, itemId, quantity, referenceNumber, supplierId, notes } = validationResult.data

    let result

    if (itemType === 'product') {
      result = await receiveProductStock(itemId, quantity, referenceNumber, supplierId, notes, payload.userId)
    } else {
      result = await receiveRawMaterialStock(itemId, quantity, referenceNumber, supplierId, notes, payload.userId)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully received ${quantity} units`,
      data: result
    })
  } catch (error) {
    console.error('Error receiving goods:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to receive goods',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Receive product stock
 */
async function receiveProductStock(
  productId: string,
  quantity: number,
  referenceNumber?: string,
  supplierId?: string,
  notes?: string,
  userId?: string
) {
  return await prisma.$transaction(async tx => {
    // Check if product exists
    const product = await tx.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    // Get or create inventory
    let inventory = await tx.productInventory.findUnique({
      where: { productId }
    })

    if (!inventory) {
      inventory = await tx.productInventory.create({
        data: {
          productId,
          quantity: 0,
          minimumStock: 10,
          reorderPoint: 20,
          unit: 'pcs'
        }
      })
    }

    const currentQty = Number(inventory.quantity)
    const newQty = currentQty + quantity

    // Update inventory
    const updatedInventory = await tx.productInventory.update({
      where: { productId },
      data: {
        quantity: newQty,
        lastRestockedAt: new Date()
      },
      include: {
        product: {
          select: {
            id: true,
            productCode: true,
            productName: true
          }
        }
      }
    })

    // Create transaction record
    await tx.inventoryTransaction.create({
      data: {
        type: 'product',
        productInventoryId: inventory.id,
        transactionType: TransactionType.PURCHASE,
        quantityChange: quantity,
        quantityBefore: currentQty,
        quantityAfter: newQty,
        referenceId: referenceNumber,
        referenceType: 'goods_received',
        notes: notes || `Goods received${supplierId ? ` from supplier` : ''}${referenceNumber ? ` - Ref: ${referenceNumber}` : ''}`,
        createdBy: userId
      }
    })

    return {
      type: 'product',
      itemId: productId,
      itemCode: updatedInventory.product.productCode,
      itemName: updatedInventory.product.productName,
      previousQuantity: currentQty,
      quantityReceived: quantity,
      newQuantity: newQty,
      unit: updatedInventory.unit
    }
  })
}

/**
 * Receive raw material stock
 */
async function receiveRawMaterialStock(
  rawMaterialId: string,
  quantity: number,
  referenceNumber?: string,
  supplierId?: string,
  notes?: string,
  userId?: string
) {
  return await prisma.$transaction(async tx => {
    // Check if raw material exists
    const rawMaterial = await tx.rawMaterial.findUnique({
      where: { id: rawMaterialId }
    })

    if (!rawMaterial) {
      throw new Error('Raw material not found')
    }

    // Get or create inventory
    let inventory = await tx.rawMaterialInventory.findUnique({
      where: { rawMaterialId }
    })

    if (!inventory) {
      inventory = await tx.rawMaterialInventory.create({
        data: {
          rawMaterialId,
          quantity: 0,
          minimumStock: 50,
          reorderPoint: 100,
          unit: 'kg'
        }
      })
    }

    const currentQty = Number(inventory.quantity)
    const newQty = currentQty + quantity

    // Update inventory
    const updatedInventory = await tx.rawMaterialInventory.update({
      where: { rawMaterialId },
      data: {
        quantity: newQty,
        lastRestockedAt: new Date()
      },
      include: {
        rawMaterial: {
          select: {
            id: true,
            materialCode: true,
            materialName: true
          }
        }
      }
    })

    // Create transaction record
    await tx.inventoryTransaction.create({
      data: {
        type: 'raw_material',
        rawMaterialInventoryId: inventory.id,
        transactionType: TransactionType.PURCHASE,
        quantityChange: quantity,
        quantityBefore: currentQty,
        quantityAfter: newQty,
        referenceId: referenceNumber,
        referenceType: 'goods_received',
        notes: notes || `Goods received${supplierId ? ` from supplier` : ''}${referenceNumber ? ` - Ref: ${referenceNumber}` : ''}`,
        createdBy: userId
      }
    })

    return {
      type: 'raw_material',
      itemId: rawMaterialId,
      itemCode: updatedInventory.rawMaterial.materialCode,
      itemName: updatedInventory.rawMaterial.materialName,
      previousQuantity: currentQty,
      quantityReceived: quantity,
      newQuantity: newQty,
      unit: updatedInventory.unit
    }
  })
}

/**
 * Get recent goods received transactions
 * GET /api/inventory/goods-received?page=1&pageSize=10
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    if (!hasPermission(payload.role as any, Resource.INVENTORY, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Get goods received transactions (PURCHASE type with goods_received reference)
    const where = {
      referenceType: 'goods_received'
    }

    const totalCount = await prisma.inventoryTransaction.count({ where })

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        productInventory: {
          include: {
            product: {
              select: {
                productCode: true,
                productName: true
              }
            }
          }
        },
        rawMaterialInventory: {
          include: {
            rawMaterial: {
              select: {
                materialCode: true,
                materialName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // Transform data
    const data = transactions.map(t => ({
      id: t.id,
      type: t.type,
      itemCode: t.type === 'product'
        ? t.productInventory?.product.productCode
        : t.rawMaterialInventory?.rawMaterial.materialCode,
      itemName: t.type === 'product'
        ? t.productInventory?.product.productName
        : t.rawMaterialInventory?.rawMaterial.materialName,
      quantityReceived: t.quantityChange,
      quantityBefore: Number(t.quantityBefore),
      quantityAfter: Number(t.quantityAfter),
      referenceNumber: t.referenceId,
      notes: t.notes,
      receivedAt: t.createdAt
    }))

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching goods received:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch goods received',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
