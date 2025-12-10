import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'
import { updateSaleSchema } from '@/types/salesTypes'

/**
 * Get single sale by ID
 * GET /api/sales/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check permissions
    if (!hasPermission(payload.role as any, Resource.SALES, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            businessName: true,
            phone: true,
            location: true
          }
        },
        product: {
          select: {
            id: true,
            productCode: true,
            productName: true,
            price: true
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json({ success: false, error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...sale,
        quantity: sale.quantity ? parseFloat(sale.quantity.toString()) : null,
        price: sale.price ? parseFloat(sale.price.toString()) : null,
        total: parseFloat(sale.total.toString()),
        amountPaid: parseFloat(sale.amountPaid.toString()),
        balance: parseFloat(sale.balance.toString()),
        product: sale.product ? {
          ...sale.product,
          price: sale.product.price ? parseFloat(sale.product.price.toString()) : null
        } : null,
        payments: sale.payments.map((payment: any) => ({
          ...payment,
          amount: parseFloat(payment.amount.toString())
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching sale:', error)

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
 * Update sale by ID
 * PUT /api/sales/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check permissions - Admin and Sales can update sales
    if (!hasPermission(payload.role as any, Resource.SALES, Action.UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validationResult = updateSaleSchema.safeParse(body)

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

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id }
    })

    if (!existingSale) {
      return NextResponse.json({ success: false, error: 'Sale not found' }, { status: 404 })
    }

    // Verify customer if being changed
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      })

      if (!customer) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
      }
    }

    // Verify product if being changed
    if (data.productId) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId }
      })

      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }
    }

    // Build update data and recalculate if needed
    const updateData: any = {}
    let needsRecalculation = false

    if (data.customerId !== undefined) updateData.customerId = data.customerId
    if (data.productId !== undefined) updateData.productId = data.productId
    if (data.supplyDate !== undefined) updateData.supplyDate = data.supplyDate
    if (data.paymentMode !== undefined) updateData.paymentMode = data.paymentMode
    if (data.paymentDate !== undefined) updateData.paymentDate = data.paymentDate

    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity
      needsRecalculation = true
    }

    if (data.price !== undefined) {
      updateData.price = data.price
      needsRecalculation = true
    }

    if (data.amountPaid !== undefined) {
      updateData.amountPaid = data.amountPaid
      needsRecalculation = true
    }

    // Recalculate total, balance, and status if needed
    if (needsRecalculation) {
      const quantity = data.quantity ?? (existingSale.quantity ? parseFloat(existingSale.quantity.toString()) : 0)
      const price = data.price ?? (existingSale.price ? parseFloat(existingSale.price.toString()) : 0)
      const amountPaid = data.amountPaid ?? parseFloat(existingSale.amountPaid.toString())

      const total = quantity * price
      const balance = total - amountPaid

      updateData.total = total
      updateData.balance = balance

      // Update status
      if (amountPaid === 0) {
        updateData.status = 'pending'
      } else if (amountPaid < total) {
        updateData.status = 'partial'
      } else {
        updateData.status = 'paid'
      }
    }

    // Update sale
    const sale = await prisma.sale.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: {
        ...sale,
        quantity: sale.quantity ? parseFloat(sale.quantity.toString()) : null,
        price: sale.price ? parseFloat(sale.price.toString()) : null,
        total: parseFloat(sale.total.toString()),
        amountPaid: parseFloat(sale.amountPaid.toString()),
        balance: parseFloat(sale.balance.toString())
      },
      message: 'Sale updated successfully'
    })
  } catch (error) {
    console.error('Error updating sale:', error)

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
 * Delete sale by ID
 * DELETE /api/sales/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check permissions - Only Admin can delete sales
    if (!hasPermission(payload.role as any, Resource.SALES, Action.DELETE)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only admins can delete sales' }, { status: 403 })
    }

    const { id } = await params

    // Check if sale exists
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            payments: true
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json({ success: false, error: 'Sale not found' }, { status: 404 })
    }

    // Check for associated payments
    if (sale._count.payments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete sale',
          message: `This sale has ${sale._count.payments} payment records and cannot be deleted`
        },
        { status: 400 }
      )
    }

    // Delete sale
    await prisma.sale.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Sale deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting sale:', error)

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
