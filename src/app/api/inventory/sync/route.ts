import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'

/**
 * Sync inventory records for all products and raw materials that don't have them
 * POST /api/inventory/sync
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

    // Check permissions - only admin can sync
    if (!hasPermission(payload.role as any, Resource.INVENTORY, Action.UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Find products without inventory records
    const productsWithoutInventory = await prisma.product.findMany({
      where: {
        inventory: {
          none: {}
        }
      },
      select: {
        id: true,
        productName: true
      }
    })

    // Find raw materials without inventory records
    const rawMaterialsWithoutInventory = await prisma.rawMaterial.findMany({
      where: {
        inventory: {
          none: {}
        }
      },
      select: {
        id: true,
        materialName: true
      }
    })

    // Create inventory records for products
    const productInventoryCreated = await Promise.all(
      productsWithoutInventory.map(product =>
        prisma.productInventory.create({
          data: {
            productId: product.id,
            quantity: 0,
            minimumStock: 10,
            maximumStock: 1000,
            reorderPoint: 20,
            unit: 'pcs'
          }
        })
      )
    )

    // Create inventory records for raw materials
    const rawMaterialInventoryCreated = await Promise.all(
      rawMaterialsWithoutInventory.map(material =>
        prisma.rawMaterialInventory.create({
          data: {
            rawMaterialId: material.id,
            quantity: 0,
            minimumStock: 100,
            maximumStock: 10000,
            reorderPoint: 200,
            unit: 'kg'
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Inventory sync completed',
      data: {
        productsWithoutInventory: productsWithoutInventory.length,
        rawMaterialsWithoutInventory: rawMaterialsWithoutInventory.length,
        productInventoryCreated: productInventoryCreated.length,
        rawMaterialInventoryCreated: rawMaterialInventoryCreated.length,
        syncedProducts: productsWithoutInventory.map(p => p.productName),
        syncedRawMaterials: rawMaterialsWithoutInventory.map(m => m.materialName)
      }
    })
  } catch (error) {
    console.error('Error syncing inventory:', error)

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

/**
 * Get inventory sync status - find products/materials without inventory records
 * GET /api/inventory/sync
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

    // Find products without inventory records
    const productsWithoutInventory = await prisma.product.findMany({
      where: {
        inventory: {
          none: {}
        }
      },
      select: {
        id: true,
        productCode: true,
        productName: true
      }
    })

    // Find raw materials without inventory records
    const rawMaterialsWithoutInventory = await prisma.rawMaterial.findMany({
      where: {
        inventory: {
          none: {}
        }
      },
      select: {
        id: true,
        materialCode: true,
        materialName: true
      }
    })

    // Count totals
    const totalProducts = await prisma.product.count()
    const totalRawMaterials = await prisma.rawMaterial.count()
    const totalProductInventory = await prisma.productInventory.count()
    const totalRawMaterialInventory = await prisma.rawMaterialInventory.count()

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalRawMaterials,
          totalProductInventory,
          totalRawMaterialInventory,
          productsWithoutInventory: productsWithoutInventory.length,
          rawMaterialsWithoutInventory: rawMaterialsWithoutInventory.length
        },
        productsWithoutInventory,
        rawMaterialsWithoutInventory
      }
    })
  } catch (error) {
    console.error('Error checking inventory sync status:', error)

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
