import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/client'
import { createProductSchema } from '@/types/productTypes'

/**
 * Get all products with search and pagination
 * GET /api/products?search=keyword&page=1&pageSize=10
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

    // Check permissions - Admin, Sales, Procurement can view products
    const allowedRoles = ['admin', 'sales', 'procurement']

    if (!allowedRoles.includes(payload.role as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Build where clause for search (MySQL is case-insensitive by default)
    const where = search
      ? {
          OR: [
            { productName: { contains: search } },
            { productCode: { contains: search } }
          ]
        }
      : {}

    // Get total count
    const totalCount = await prisma.product.count({ where })

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        _count: {
          select: {
            sales: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // Transform to include salesCount
    const productsWithStats = products.map(product => ({
      ...product,
      price: product.price ? parseFloat(product.price.toString()) : null,
      salesCount: product._count.sales
    }))

    return NextResponse.json({
      success: true,
      data: productsWithStats,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)

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
 * Create new product with auto-generated product code
 * POST /api/products
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value

    console.log('🔐 POST /api/products - Token check:', { hasToken: !!token, tokenLength: token?.length })

    if (!token) {
      console.log('❌ POST /api/products - No token found in cookies')

      return NextResponse.json({ success: false, error: 'Unauthorized - No token' }, { status: 401 })
    }

    const payload = verifyToken(token)

    console.log('🔐 POST /api/products - Payload:', payload)

    if (!payload) {
      console.log('❌ POST /api/products - Token verification failed')

      return NextResponse.json({ success: false, error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    // Check permissions - Admin and Procurement can create products
    const allowedRoles = ['admin', 'procurement']

    console.log('🔐 POST /api/products - Role check:', { userRole: payload.role, allowedRoles })

    if (!allowedRoles.includes(payload.role.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = createProductSchema.safeParse(body)

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

    // Check for duplicate product name (MySQL is case-insensitive by default)
    const existingProduct = await prisma.product.findFirst({
      where: {
        productName: data.productName
      }
    })

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product name already exists',
          message: `A product with name "${data.productName}" already exists`
        },
        { status: 400 }
      )
    }

    // Generate product code (PROD-XXXX)
    const lastProduct = await prisma.product.findFirst({
      orderBy: { productCode: 'desc' },
      select: { productCode: true }
    })

    let nextNumber = 1

    if (lastProduct) {
      const match = lastProduct.productCode.match(/PROD-(\d+)/)

      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    const productCode = `PROD-${nextNumber.toString().padStart(4, '0')}`

    // Create product with inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create product
      const product = await tx.product.create({
        data: {
          productCode,
          productName: data.productName,
          price: data.price
        }
      })

      // Create inventory record
      const inventory = await tx.productInventory.create({
        data: {
          productId: product.id,
          quantity: data.initialStock || 0,
          minimumStock: data.minimumStock || 10,
          maximumStock: data.maximumStock || null,
          reorderPoint: data.reorderPoint || 20,
          unit: data.unit || 'pcs',
          lastRestockedAt: data.initialStock && data.initialStock > 0 ? new Date() : null
        }
      })

      // If there's initial stock, create an inventory transaction
      if (data.initialStock && data.initialStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            type: 'product',
            productInventoryId: inventory.id,
            transactionType: 'adjustment',
            quantityChange: data.initialStock,
            quantityBefore: 0,
            quantityAfter: data.initialStock,
            notes: 'Initial stock on product creation',
            createdBy: payload.userId
          }
        })
      }

      return { product, inventory }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result.product,
          price: result.product.price ? parseFloat(result.product.price.toString()) : null,
          inventory: {
            quantity: Number(result.inventory.quantity),
            minimumStock: Number(result.inventory.minimumStock),
            maximumStock: result.inventory.maximumStock ? Number(result.inventory.maximumStock) : null,
            reorderPoint: Number(result.inventory.reorderPoint),
            unit: result.inventory.unit
          }
        },
        message: 'Product created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating product:', error)

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

