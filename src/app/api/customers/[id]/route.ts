/**
 * Customer API Routes - GET (single), PUT (update), DELETE
 * Handles individual customer operations
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'
import { updateCustomerSchema } from '@/types/customerTypes'

/**
 * GET /api/customers/[id]
 * Get a single customer by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    // 2. Check permissions
    if (!hasPermission(payload.role as any, Resource.CUSTOMERS, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Customer not found'
        },
        { status: 404 }
      )
    }

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Error fetching customer:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to fetch customer'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/customers/[id]
 * Update a customer by ID
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    // 2. Check permissions (Admin, Sales Officer can update customers)
    if (!hasPermission(payload.role as any, Resource.CUSTOMERS, Action.UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Customer not found'
        },
        { status: 404 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validation = updateCustomerSchema.safeParse(body)

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

    // 5. Check if business name is being changed and if it already exists
    if (data.businessName && data.businessName !== existingCustomer.businessName) {
      const duplicateCustomer = await prisma.customer.findFirst({
        where: { businessName: data.businessName }
      })

      if (duplicateCustomer) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            message: 'A customer with this business name already exists'
          },
          { status: 400 }
        )
      }
    }

    // 6. Update customer (note: customerCode cannot be changed)
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.businessName && { businessName: data.businessName }),
        ...(data.address && { address: data.address }),
        ...(data.phone && { phone: data.phone }),
        ...(data.location && { location: data.location })
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    })
  } catch (error) {
    console.error('Error updating customer:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to update customer'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete a customer by ID
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    // 2. Check permissions (Admin, Sales Officer can delete customers)
    if (!hasPermission(payload.role as any, Resource.CUSTOMERS, Action.DELETE)) {
      return NextResponse.json({ success: false, error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Customer not found'
        },
        { status: 404 }
      )
    }

    // 4. Check if customer has associated sales
    const salesCount = await prisma.sale.count({
      where: { customerId: id }
    })

    if (salesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: `Cannot delete customer with ${salesCount} associated sales transaction(s)`
        },
        { status: 400 }
      )
    }

    // 5. Delete customer
    await prisma.customer.delete({
      where: { id }
    })

    // 6. Return response
    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to delete customer'
      },
      { status: 500 }
    )
  }
}

