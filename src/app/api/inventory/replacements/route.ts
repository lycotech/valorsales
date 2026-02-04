import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission } from '@/lib/auth/permissions'
import { Resource, Action } from '@/lib/auth/permissions'
import { logCreate, getRequestDetails } from '@/lib/auditLogger'

/**
 * GET /api/inventory/replacements
 * List all product replacements with filters
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid token' }, { status: 401 })
    }

    // 2. Check permissions
    if (!hasPermission(payload.role as any, Resource.INVENTORY, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const productId = searchParams.get('productId') || undefined
    const saleId = searchParams.get('saleId') || undefined
    const reason = searchParams.get('reason') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    // 4. Build where clause
    const where: any = {}

    if (productId) where.productId = productId
    if (saleId) where.saleId = saleId
    if (reason) where.reason = reason
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // 5. Fetch replacements with pagination
    const [replacements, total] = await Promise.all([
      prisma.productReplacement.findMany({
        where,
        include: {
          sale: {
            include: {
              customer: true
            }
          },
          product: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.productReplacement.count({ where })
    ])

    // 6. Format response
    const formattedReplacements = replacements.map(replacement => ({
      ...replacement,
      quantity: parseFloat(replacement.quantity.toString())
    }))

    return NextResponse.json({
      success: true,
      data: formattedReplacements,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching replacements:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/replacements
 * Record a new product replacement
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid token' }, { status: 401 })
    }

    // 2. Check permissions
    if (!hasPermission(payload.role as any, Resource.INVENTORY, Action.CREATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Parse request body
    const body = await request.json()
    const { saleId, productId, quantity, reason, notes } = body

    // 4. Validate required fields
    if (!saleId || typeof saleId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Sale ID is required'
        },
        { status: 400 }
      )
    }

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Product ID is required'
        },
        { status: 400 }
      )
    }

    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Valid quantity is required'
        },
        { status: 400 }
      )
    }

    if (!reason || !['damaged', 'defective', 'expired', 'other'].includes(reason)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Valid reason is required (damaged, defective, expired, or other)'
        },
        { status: 400 }
      )
    }

    // 5. Verify sale exists and contains the product
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
        product: true
      }
    })

    if (!sale) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Sale not found'
        },
        { status: 404 }
      )
    }

    // Check if product is in the sale (either legacy single product or in items)
    const productInSale =
      sale.productId === productId || sale.items.some(item => item.productId === productId)

    if (!productInSale) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Product not found in this sale'
        },
        { status: 400 }
      )
    }

    // 6. Check inventory availability
    const inventory = await prisma.productInventory.findFirst({
      where: { productId }
    })

    if (!inventory || parseFloat(inventory.quantity.toString()) < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient inventory',
          message: 'Not enough inventory to fulfill replacement'
        },
        { status: 400 }
      )
    }

    // 7. Create replacement record and update inventory in a transaction
    const replacement = await prisma.$transaction(async tx => {
      // Create replacement record
      const newReplacement = await tx.productReplacement.create({
        data: {
          saleId,
          productId,
          quantity,
          reason,
          notes: notes?.trim() || null,
          createdBy: payload.userId
        },
        include: {
          sale: {
            include: {
              customer: true
            }
          },
          product: true
        }
      })

      // Update inventory and get the updated quantity
      const currentQuantity = parseFloat(inventory.quantity.toString())
      const newQuantity = currentQuantity - quantity

      const updatedInventory = await tx.productInventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQuantity
        }
      })

      // Create inventory transaction
      await tx.inventoryTransaction.create({
        data: {
          type: 'product',
          productInventoryId: inventory.id,
          transactionType: 'adjustment',
          quantityChange: -quantity,
          quantityBefore: currentQuantity,
          quantityAfter: newQuantity,
          referenceId: newReplacement.id,
          referenceType: 'replacement',
          notes: `Replacement: ${reason} - ${notes || 'No notes'}`
        }
      })

      return newReplacement
    })

    // 8. Audit log
    const reqDetails = getRequestDetails(request)

    logCreate(
      'inventory',
      replacement.id,
      {
        saleId,
        productId,
        quantity,
        reason,
        type: 'replacement'
      },
      payload.userId,
      reqDetails
    )

    // 9. Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          ...replacement,
          quantity: parseFloat(replacement.quantity.toString())
        },
        message: 'Replacement recorded successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating replacement:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An error occurred'
      },
      { status: 500 }
    )
  }
}
