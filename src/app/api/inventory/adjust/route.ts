import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'
import { inventoryAdjustmentSchema, TransactionType } from '@/types/inventoryTypes'

/**
 * Manual inventory adjustment (add or remove stock)
 * POST /api/inventory/adjust
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

    // Check permissions
    if (!hasPermission(payload.role as any, Resource.INVENTORY, Action.UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate request
    const validationResult = inventoryAdjustmentSchema.safeParse(body)

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

    const { type, itemId, quantityChange, notes } = validationResult.data

    // Adjust inventory in transaction
    const result = await prisma.$transaction(async tx => {
      if (type === 'product') {
        // Get current inventory
        const inventory = await tx.productInventory.findUnique({
          where: { productId: itemId },
          include: { product: true }
        })

        if (!inventory) {
          throw new Error('Product inventory not found')
        }

        const currentQty = Number(inventory.quantity)
        const newQty = currentQty + quantityChange

        if (newQty < 0) {
          throw new Error(`Invalid adjustment. Current stock: ${currentQty}, Cannot remove: ${Math.abs(quantityChange)}`)
        }

        // Update inventory
        const updated = await tx.productInventory.update({
          where: { productId: itemId },
          data: {
            quantity: newQty,
            lastRestockedAt: quantityChange > 0 ? new Date() : undefined
          },
          include: { product: true }
        })

        // Create transaction record
        await tx.inventoryTransaction.create({
          data: {
            type: 'product',
            productInventoryId: inventory.id,
            transactionType: TransactionType.ADJUSTMENT,
            quantityChange,
            quantityBefore: currentQty,
            quantityAfter: newQty,
            notes: notes || `Manual adjustment by ${payload.email}`,
            createdBy: payload.userId
          }
        })

        return {
          type: 'product',
          item: updated.product,
          inventory: {
            quantity: parseFloat(updated.quantity.toString()),
            previousQuantity: currentQty,
            change: quantityChange
          }
        }
      } else {
        // Raw material adjustment
        const inventory = await tx.rawMaterialInventory.findUnique({
          where: { rawMaterialId: itemId },
          include: { rawMaterial: true }
        })

        if (!inventory) {
          throw new Error('Raw material inventory not found')
        }

        const currentQty = Number(inventory.quantity)
        const newQty = currentQty + quantityChange

        if (newQty < 0) {
          throw new Error(`Invalid adjustment. Current stock: ${currentQty}, Cannot remove: ${Math.abs(quantityChange)}`)
        }

        // Update inventory
        const updated = await tx.rawMaterialInventory.update({
          where: { rawMaterialId: itemId },
          data: {
            quantity: newQty,
            lastRestockedAt: quantityChange > 0 ? new Date() : undefined
          },
          include: { rawMaterial: true }
        })

        // Create transaction record
        await tx.inventoryTransaction.create({
          data: {
            type: 'raw_material',
            rawMaterialInventoryId: inventory.id,
            transactionType: TransactionType.ADJUSTMENT,
            quantityChange,
            quantityBefore: currentQty,
            quantityAfter: newQty,
            notes: notes || `Manual adjustment by ${payload.email}`,
            createdBy: payload.userId
          }
        })

        return {
          type: 'raw_material',
          item: updated.rawMaterial,
          inventory: {
            quantity: parseFloat(updated.quantity.toString()),
            previousQuantity: currentQty,
            change: quantityChange
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: result
    })
  } catch (error) {
    console.error('Error adjusting inventory:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
