import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'
import { createSalePaymentSchema } from '@/types/salesTypes'

/**
 * Add payment to a sale
 * POST /api/sales/[id]/payments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
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

    // Check permissions - Admin and Sales can add payments
    if (!hasPermission(payload.role as any, Resource.SALES, Action.UPDATE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: saleId } = await params
    const body = await request.json()

    // Validate request body
    const validationResult = createSalePaymentSchema.safeParse({ ...body, saleId })

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
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        payments: true
      }
    })

    if (!sale) {
      return NextResponse.json({ success: false, error: 'Sale not found' }, { status: 404 })
    }

    // Calculate current amount paid (including existing payments)
    const existingPayments = sale.payments.reduce(
      (sum: number, payment: any) => sum + parseFloat(payment.amount.toString()),
      0 // Start from 0 to avoid double-counting (sale.amountPaid already includes all payments)
    )

    const newTotalPaid = existingPayments + data.amount
    const saleTotal = parseFloat(sale.total.toString())

    // Prevent overpayment
    if (newTotalPaid > saleTotal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment exceeds balance',
          message: `Payment amount would exceed sale total. Remaining balance: ₦${(
            saleTotal - existingPayments
          ).toFixed(2)}`
        },
        { status: 400 }
      )
    }

    // Create payment and update sale in a transaction
    const [payment, updatedSale] = await prisma.$transaction([
      // Create payment record
      prisma.salePayment.create({
        data: {
          saleId,
          amount: data.amount,
          paymentDate: data.paymentDate,
          paymentMode: data.paymentMode,
          notes: data.notes || null
        }
      }),

      // Update sale balance and status
      prisma.sale.update({
        where: { id: saleId },
        data: {
          amountPaid: newTotalPaid,
          balance: saleTotal - newTotalPaid,
          status: newTotalPaid === 0 ? 'pending' : newTotalPaid < saleTotal ? 'partial' : 'paid',
          paymentDate: data.paymentDate
        }
      })
    ])

    return NextResponse.json(
      {
        success: true,
        data: {
          payment: {
            ...payment,
            amount: parseFloat(payment.amount.toString())
          },
          sale: {
            ...updatedSale,
            quantity: updatedSale.quantity ? parseFloat(updatedSale.quantity.toString()) : null,
            price: updatedSale.price ? parseFloat(updatedSale.price.toString()) : null,
            total: parseFloat(updatedSale.total.toString()),
            amountPaid: parseFloat(updatedSale.amountPaid.toString()),
            balance: parseFloat(updatedSale.balance.toString())
          }
        },
        message: 'Payment added successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding payment:', error)

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
 * Get all payments for a sale
 * GET /api/sales/[id]/payments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
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

    // Check permissions
    if (!hasPermission(payload.role as any, Resource.SALES, Action.READ)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: saleId } = await params

    const payments = await prisma.salePayment.findMany({
      where: { saleId },
      orderBy: {
        paymentDate: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: payments.map((payment: any) => ({
        ...payment,
        amount: parseFloat(payment.amount.toString())
      }))
    })
  } catch (error) {
    console.error('Error fetching payments:', error)

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
