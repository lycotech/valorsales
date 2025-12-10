import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * GET /api/inventory/transactions
 * Fetch inventory transaction history with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const type = searchParams.get('type') // 'sale', 'purchase', 'adjustment', 'return'
    const inventoryType = searchParams.get('inventoryType') // 'product', 'raw_material'

    // Build where clause
    const where: any = {}

    if (type) {
      where.transactionType = type
    }

    if (inventoryType === 'product') {
      where.productInventoryId = { not: null }
    } else if (inventoryType === 'raw_material') {
      where.rawMaterialInventoryId = { not: null }
    }

    // Get total count
    const totalCount = await prisma.inventoryTransaction.count({ where })

    // Get transactions with pagination
    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        productInventory: {
          include: {
            product: {
              select: {
                productName: true,
                productCode: true
              }
            }
          }
        },
        rawMaterialInventory: {
          include: {
            rawMaterial: {
              select: {
                materialName: true,
                materialCode: true
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
    const transformedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      transactionType: tx.transactionType,
      quantityChange: Number(tx.quantityChange),
      quantityBefore: Number(tx.quantityBefore),
      quantityAfter: Number(tx.quantityAfter),
      referenceId: tx.referenceId,
      referenceType: tx.referenceType,
      notes: tx.notes,
      createdBy: tx.createdBy,
      createdAt: tx.createdAt.toISOString(),
      productInventory: tx.productInventory
        ? {
            product: tx.productInventory.product
          }
        : null,
      rawMaterialInventory: tx.rawMaterialInventory
        ? {
            rawMaterial: tx.rawMaterialInventory.rawMaterial
          }
        : null
    }))

    return NextResponse.json({
      success: true,
      data: transformedTransactions,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching inventory transactions:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch inventory transactions'
      },
      { status: 500 }
    )
  }
}
