/**
 * Supplier API Routes - GET (list) and POST (create)
 * Handles supplier listing and creation with auto-generated codes
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'
import { createSupplierSchema } from '@/types/supplierTypes'

/**
 * GET /api/suppliers
 * List all suppliers with optional search and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'No token provided' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      )
    }

    // 2. Check permissions (Admin, Procurement Officer can read suppliers)
    if (!hasPermission(payload.role as any, Resource.SUPPLIERS, Action.READ)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Get query parameters for search and pagination
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const skip = (page - 1) * pageSize

    // 4. Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { supplierCode: { contains: search } },
            { address: { contains: search } },
            { phone: { contains: search } },
            { otherPhone: { contains: search } },
            { location: { contains: search } }
          ]
        }
      : {}

    // 5. Fetch suppliers with pagination and item count
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              items: true,
              purchases: true
            }
          }
        }
      }),
      prisma.supplier.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: suppliers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/suppliers
 * Create a new supplier with optional items
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'No token provided' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      )
    }

    // 2. Check permissions (Admin, Procurement Officer can create suppliers)
    if (!hasPermission(payload.role as any, Resource.SUPPLIERS, Action.CREATE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validation = createSupplierSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: validation.error.issues[0].message,
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // 4. Check if supplier name already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { name: data.name }
    })

    if (existingSupplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'A supplier with this name already exists'
        },
        { status: 400 }
      )
    }

    // 5. Generate supplier code (SUPP-XXXX format)
    const lastSupplier = await prisma.supplier.findFirst({
      orderBy: { supplierCode: 'desc' },
      select: { supplierCode: true }
    })

    let nextNumber = 1

    if (lastSupplier) {
      const lastNumber = parseInt(lastSupplier.supplierCode.split('-')[1])

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }

    const supplierCode = `SUPP-${nextNumber.toString().padStart(4, '0')}`

    // 6. Generate item codes for items if provided
    let itemsData: Array<{ itemCode: string; itemName: string }> = []

    if (data.items && data.items.length > 0) {
      const lastItem = await prisma.supplierItem.findFirst({
        orderBy: { itemCode: 'desc' },
        select: { itemCode: true }
      })

      let nextItemNumber = 1

      if (lastItem) {
        const lastItemNumber = parseInt(lastItem.itemCode.split('-')[1])

        if (!isNaN(lastItemNumber)) {
          nextItemNumber = lastItemNumber + 1
        }
      }

      itemsData = data.items.map((item, index) => ({
        itemCode: `ITEM-${(nextItemNumber + index).toString().padStart(4, '0')}`,
        itemName: item.itemName
      }))
    }

    // 7. Create supplier with items in a transaction
    const supplier = await prisma.supplier.create({
      data: {
        supplierCode,
        name: data.name,
        address: data.address,
        phone: data.phone,
        otherPhone: data.otherPhone || null,
        location: data.location,
        items: {
          create: itemsData
        }
      },
      include: {
        items: true,
        _count: {
          select: {
            items: true,
            purchases: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: supplier,
        message: 'Supplier created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating supplier:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}

