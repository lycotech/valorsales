import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'
import { calculateStockStatus } from '@/lib/inventory/operations'

/**
 * Get all raw material inventory with stock levels
 * GET /api/inventory/raw-materials?search=keyword&status=low_stock&page=1&pageSize=10
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

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Build where clause
    const where: any = {}

    if (search) {
      where.rawMaterial = {
        OR: [
          { materialName: { contains: search, mode: 'insensitive' } },
          { materialCode: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    // Get total count
    const totalCount = await prisma.rawMaterialInventory.count({ where })

    // Get inventory with pagination
    const inventory = await prisma.rawMaterialInventory.findMany({
      where,
      include: {
        rawMaterial: {
          select: {
            id: true,
            materialCode: true,
            materialName: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // Transform and filter by status
    let inventoryData = inventory.map(item => {
      const stockStatus = calculateStockStatus(
        item.quantity,
        item.minimumStock,
        item.maximumStock,
        item.reorderPoint
      )

      return {
        id: item.id,
        rawMaterialId: item.rawMaterialId,
        materialCode: item.rawMaterial.materialCode,
        materialName: item.rawMaterial.materialName,
        quantity: parseFloat(item.quantity.toString()),
        minimumStock: parseFloat(item.minimumStock.toString()),
        maximumStock: item.maximumStock ? parseFloat(item.maximumStock.toString()) : null,
        reorderPoint: parseFloat(item.reorderPoint.toString()),
        unit: item.unit,
        status: stockStatus,
        lastRestockedAt: item.lastRestockedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    })

    // Filter by status if specified
    if (status) {
      inventoryData = inventoryData.filter(item => item.status === status)
    }

    return NextResponse.json({
      success: true,
      data: inventoryData,
      pagination: {
        page,
        pageSize,
        totalCount: status ? inventoryData.length : totalCount,
        totalPages: Math.ceil((status ? inventoryData.length : totalCount) / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching raw material inventory:', error)

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
