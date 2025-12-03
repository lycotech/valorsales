import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'
import { calculateStockStatus } from '@/lib/inventory/operations'

/**
 * Get low stock alerts
 * GET /api/inventory/alerts
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

    // Check permissions
    if (!hasPermission(payload.role as any, Resource.INVENTORY, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Get low stock products (quantity <= reorderPoint OR quantity = 0)
    const lowStockProducts = await prisma.productInventory.findMany({
      where: {
        OR: [
          { quantity: { equals: 0 } },
          {
            AND: [
              { quantity: { gt: 0 } },

              // Use raw SQL for comparing quantity with reorderPoint
              prisma.productInventory.fields.quantity <= prisma.productInventory.fields.reorderPoint
            ]
          }
        ]
      },
      include: {
        product: {
          select: {
            id: true,
            productCode: true,
            productName: true
          }
        }
      },
      orderBy: { quantity: 'asc' }
    })

    // Get low stock raw materials
    const lowStockMaterials = await prisma.rawMaterialInventory.findMany({
      where: {
        OR: [
          { quantity: { equals: 0 } },
          {
            AND: [
              { quantity: { gt: 0 } },
              prisma.rawMaterialInventory.fields.quantity <= prisma.rawMaterialInventory.fields.reorderPoint
            ]
          }
        ]
      },
      include: {
        rawMaterial: {
          select: {
            id: true,
            materialCode: true,
            materialName: true
          }
        }
      },
      orderBy: { quantity: 'asc' }
    })

    // Transform products
    const productAlerts = lowStockProducts
      .map(item => {
        const qty = Number(item.quantity)
        const reorderPt = Number(item.reorderPoint)
        const minStock = Number(item.minimumStock)

        // Only include if actually low
        if (qty > reorderPt) return null

        const status = calculateStockStatus(
          item.quantity,
          item.minimumStock,
          item.maximumStock,
          item.reorderPoint
        )

        return {
          id: item.id,
          itemId: item.productId,
          itemCode: item.product.productCode,
          itemName: item.product.productName,
          type: 'product' as const,
          currentStock: qty,
          minimumStock: minStock,
          reorderPoint: reorderPt,
          unit: item.unit,
          status,
          message:
            qty === 0
              ? `OUT OF STOCK: ${item.product.productName}`
              : `LOW STOCK: ${item.product.productName} - ${qty} ${item.unit} remaining (reorder at ${reorderPt})`
        }
      })
      .filter(Boolean)

    // Transform materials
    const materialAlerts = lowStockMaterials
      .map(item => {
        const qty = Number(item.quantity)
        const reorderPt = Number(item.reorderPoint)
        const minStock = Number(item.minimumStock)

        // Only include if actually low
        if (qty > reorderPt) return null

        const status = calculateStockStatus(
          item.quantity,
          item.minimumStock,
          item.maximumStock,
          item.reorderPoint
        )

        return {
          id: item.id,
          itemId: item.rawMaterialId,
          itemCode: item.rawMaterial.materialCode,
          itemName: item.rawMaterial.materialName,
          type: 'raw_material' as const,
          currentStock: qty,
          minimumStock: minStock,
          reorderPoint: reorderPt,
          unit: item.unit,
          status,
          message:
            qty === 0
              ? `OUT OF STOCK: ${item.rawMaterial.materialName}`
              : `LOW STOCK: ${item.rawMaterial.materialName} - ${qty} ${item.unit} remaining (reorder at ${reorderPt})`
        }
      })
      .filter(Boolean)

    const alerts = [...productAlerts, ...materialAlerts]

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        summary: {
          total: alerts.length,
          products: productAlerts.length,
          rawMaterials: materialAlerts.length,
          outOfStock: alerts.filter(a => a.status === 'out_of_stock').length,
          lowStock: alerts.filter(a => a.status === 'low_stock').length
        }
      }
    })
  } catch (error) {
    console.error('Error fetching inventory alerts:', error)

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
