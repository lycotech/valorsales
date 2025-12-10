/**
 * Customer API Routes - GET (list) and POST (create)
 * Handles customer listing and creation with auto-generated codes
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'
import { createCustomerSchema } from '@/types/customerTypes'

/**
 * GET /api/customers
 * List all customers with optional search and pagination
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      )
    }

    // 2. Check permissions (Admin, Sales Officer can read customers)
    if (!hasPermission(payload.role as any, Resource.CUSTOMERS, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Get query parameters for search and pagination
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const skip = (page - 1) * pageSize

    // 4. Build where clause for search (MySQL is case-insensitive by default)
    const where = search
      ? {
          OR: [
            { businessName: { contains: search } },
            { customerCode: { contains: search } },
            { address: { contains: search } },
            { phone: { contains: search } },
            { location: { contains: search } }
          ]
        }
      : {}

    // 5. Fetch customers and total count
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.customer.count({ where })
    ])

    // 6. Return response with creditBalance formatted
    return NextResponse.json({
      success: true,
      data: customers.map(c => ({
        ...c,
        creditBalance: parseFloat(c.creditBalance.toString())
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to fetch customers'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/customers
 * Create a new customer with auto-generated customer code
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      )
    }

    // 2. Check permissions (Admin, Sales Officer can create customers)
    if (!hasPermission(payload.role as any, Resource.CUSTOMERS, Action.CREATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validation = createCustomerSchema.safeParse(body)

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

    // 4. Check if business name already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { businessName: data.businessName }
    })

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'A customer with this business name already exists'
        },
        { status: 400 }
      )
    }

    // 5. Generate customer code (CUST-XXXX format)
    const lastCustomer = await prisma.customer.findFirst({
      orderBy: { customerCode: 'desc' },
      select: { customerCode: true }
    })

    let nextNumber = 1

    if (lastCustomer) {
      const lastNumber = parseInt(lastCustomer.customerCode.split('-')[1])

      nextNumber = lastNumber + 1
    }

    const customerCode = `CUST-${nextNumber.toString().padStart(4, '0')}`

    // 6. Create customer
    const customer = await prisma.customer.create({
      data: {
        customerCode,
        businessName: data.businessName,
        address: data.address,
        phone: data.phone,
        location: data.location
      }
    })

    // 7. Return response
    return NextResponse.json(
      {
        success: true,
        message: 'Customer created successfully',
        data: customer
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating customer:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to create customer'
      },
      { status: 500 }
    )
  }
}

