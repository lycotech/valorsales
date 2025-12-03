import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/db/client'
import { createProductSchema } from '@/types/productTypes'
import { Resource, Action } from '@/types/commonTypes'

/**
 * Get all products with search and pagination
 * GET /api/products?search=keyword&page=1&pageSize=10
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await verifyToken(request)

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

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { productName: { contains: search, mode: 'insensitive' as const } },
            { productCode: { contains: search, mode: 'insensitive' as const } }
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
    const payload = await verifyToken(request)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - Admin and Procurement can create products
    const allowedRoles = ['admin', 'procurement']

    if (!allowedRoles.includes(payload.role as any)) {
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
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check for duplicate product name
    const existingProduct = await prisma.product.findFirst({
      where: {
        productName: {
          equals: data.productName,
          mode: 'insensitive'
        }
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

    // Create product
    const product = await prisma.product.create({
      data: {
        productCode,
        productName: data.productName,
        price: data.price
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...product,
          price: product.price ? parseFloat(product.price.toString()) : null
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

