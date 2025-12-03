import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'
import { createSaleSchema } from '@/types/salesTypes'

/**
 * Get all sales with search and pagination
 * GET /api/sales?search=keyword&customerId=xxx&status=pending&page=1&pageSize=10
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid token' }, { status: 401 })
    }

    // Check permissions - Admin, Sales can view sales
    if (!hasPermission(payload.role as any, Resource.SALES, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const customerId = searchParams.get('customerId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: search, mode: 'insensitive' } } },
        { product: { productName: { contains: search, mode: 'insensitive' } } },
        { product: { productCode: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    // Get total count
    const totalCount = await prisma.sale.count({ where })

    // Get sales with pagination
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            businessName: true
          }
        },
        product: {
          select: {
            id: true,
            productCode: true,
            productName: true
          }
        },
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // Transform to include decimal conversions
    const salesWithData = sales.map((sale: any) => ({
      ...sale,
      quantity: parseFloat(sale.quantity.toString()),
      price: parseFloat(sale.price.toString()),
      total: parseFloat(sale.total.toString()),
      amountPaid: parseFloat(sale.amountPaid.toString()),
      balance: parseFloat(sale.balance.toString()),
      paymentCount: sale._count.payments
    }))

    return NextResponse.json({
      success: true,
      data: salesWithData,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)

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
 * Create new sale transaction
 * POST /api/sales
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid token' }, { status: 401 })
    }

    // Check permissions - Admin and Sales can create sales
    if (!hasPermission(payload.role as any, Resource.SALES, Action.CREATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = createSaleSchema.safeParse(body)

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

    const data = validationResult.data

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    })

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found'
        },
        { status: 404 }
      )
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      )
    }

    // Calculate total and balance
    const total = data.quantity * data.price
    const balance = total - data.amountPaid

    // Determine status
    let status: 'pending' | 'partial' | 'paid' = 'pending'

    if (data.amountPaid === 0) {
      status = 'pending'
    } else if (data.amountPaid < total) {
      status = 'partial'
    } else {
      status = 'paid'
    }

    // Create sale with inventory deduction in transaction
    const sale = await prisma.$transaction(async tx => {
      // Check inventory availability
      const inventory = await tx.productInventory.findUnique({
        where: { productId: data.productId }
      })

      if (!inventory) {
        throw new Error(`No inventory record found for product ${product.productName}`)
      }

      const availableQty = Number(inventory.quantity)
      const requiredQty = data.quantity

      if (availableQty < requiredQty) {
        throw new Error(
          `Insufficient stock for ${product.productName}. Available: ${availableQty}, Required: ${requiredQty}`
        )
      }

      // Create sale
      const newSale = await tx.sale.create({
        data: {
          customerId: data.customerId,
          productId: data.productId,
          quantity: data.quantity,
          price: data.price,
          total,
          supplyDate: data.supplyDate,
          paymentMode: data.paymentMode,
          amountPaid: data.amountPaid,
          balance,
          paymentDate: data.paymentDate || null,
          status
        },
        include: {
          customer: true,
          product: true
        }
      })

      // Deduct from inventory
      const newQuantity = availableQty - requiredQty

      await tx.productInventory.update({
        where: { productId: data.productId },
        data: { quantity: newQuantity }
      })

      // Create inventory transaction record
      await tx.inventoryTransaction.create({
        data: {
          type: 'product',
          productInventoryId: inventory.id,
          transactionType: 'sale',
          quantityChange: -requiredQty,
          quantityBefore: availableQty,
          quantityAfter: newQuantity,
          referenceId: newSale.id,
          referenceType: 'sale',
          notes: `Stock deducted for sale to ${customer.businessName}`,
          createdBy: payload.userId
        }
      })

      return newSale
    })

    // Return sale with updated structure
    const saleResponse = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            businessName: true
          }
        },
        product: {
          select: {
            id: true,
            productCode: true,
            productName: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...sale,
          quantity: parseFloat(sale.quantity.toString()),
          price: parseFloat(sale.price.toString()),
          total: parseFloat(sale.total.toString()),
          amountPaid: parseFloat(sale.amountPaid.toString()),
          balance: parseFloat(sale.balance.toString())
        },
        message: 'Sale created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating sale:', error)

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
