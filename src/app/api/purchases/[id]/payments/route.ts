import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import prisma from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/purchases/[id]/payments
 * Get all payments for a purchase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Authentication
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Permission check
    if (!hasPermission(payload.role as any, Resource.PURCHASES, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch payments
    const payments = await prisma.purchasePayment.findMany({
      where: { purchaseId: id },
      orderBy: { paymentDate: 'desc' }
    })

    // Convert Decimal to number
    const paymentsData = payments.map((payment: any) => ({
      ...payment,
      amount: Number(payment.amount)
    }))

    return NextResponse.json({
      success: true,
      data: paymentsData
    })
  } catch (error) {
    console.error('Error fetching payments:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/purchases/[id]/payments
 * Add a payment to a purchase
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Authentication
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Permission check
    if (!hasPermission(payload.role as any, Resource.PURCHASES, Action.UPDATE)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { amount, paymentDate, paymentMode, notes } = body

    // Validation
    if (!amount || !paymentDate || !paymentMode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const amountNum = parseFloat(amount)

    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Payment amount must be a positive number' },
        { status: 400 }
      )
    }

    // Fetch purchase with existing payments
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { payments: true }
    })

    if (!purchase) {
      return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 })
    }

    // Calculate total already paid from payment records
    const totalPaidFromPayments = purchase.payments.reduce((sum: number, payment: any) => {
      return sum + Number(payment.amount)
    }, 0)

    // Calculate new total paid
    const newTotalPaid = totalPaidFromPayments + amountNum
    const purchaseTotal = Number(purchase.totalAmount)

    // Validate payment doesn't exceed balance
    if (newTotalPaid > purchaseTotal) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount exceeds remaining balance. Balance: ₦${(purchaseTotal - totalPaidFromPayments).toFixed(2)}`
        },
        { status: 400 }
      )
    }

    // Calculate new balance
    const newBalance = purchaseTotal - newTotalPaid

    // Determine new status
    let newStatus = 'pending'

    if (newTotalPaid === 0) {
      newStatus = 'pending'
    } else if (newTotalPaid > 0 && newTotalPaid < purchaseTotal) {
      newStatus = 'partial'
    } else if (newTotalPaid >= purchaseTotal) {
      newStatus = 'paid'
    }

    // Create payment and update purchase in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create payment record
      const payment = await tx.purchasePayment.create({
        data: {
          purchaseId: id,
          amount: amountNum,
          paymentDate: new Date(paymentDate),
          paymentMode,
          notes
        }
      })

      // Update purchase balance and status
      const updatedPurchase = await tx.purchase.update({
        where: { id },
        data: {
          amountPaid: newTotalPaid,
          balance: newBalance,
          status: newStatus
        },
        include: {
          supplier: true,
          rawMaterial: true,
          payments: {
            orderBy: { paymentDate: 'desc' }
          }
        }
      })

      return { payment, purchase: updatedPurchase }
    })

    // Convert Decimal to number
    const paymentData = {
      ...result.payment,
      amount: Number(result.payment.amount)
    }

    const purchaseData = {
      ...result.purchase,
      quantity: Number(result.purchase.quantity),
      totalAmount: Number(result.purchase.totalAmount),
      amountPaid: Number(result.purchase.amountPaid),
      balance: Number(result.purchase.balance),
      payments: result.purchase.payments.map((p: any) => ({
        ...p,
        amount: Number(p.amount)
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        payment: paymentData,
        purchase: purchaseData
      },
      message: 'Payment added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding payment:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to add payment' },
      { status: 500 }
    )
  }
}
