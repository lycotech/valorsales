import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import prisma from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/purchases/[id]
 * Get a single purchase by ID
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

    // Fetch purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        rawMaterial: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    })

    if (!purchase) {
      return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 })
    }

    // Convert Decimal fields to numbers
    const purchaseData = {
      ...purchase,
      quantity: Number(purchase.quantity),
      totalAmount: Number(purchase.totalAmount),
      amountPaid: Number(purchase.amountPaid),
      balance: Number(purchase.balance),
      payments: purchase.payments.map((payment: any) => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    }

    return NextResponse.json({
      success: true,
      data: purchaseData
    })
  } catch (error) {
    console.error('Error fetching purchase:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/purchases/[id]
 * Update a purchase
 */
export async function PUT(
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

    // Check if purchase exists
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: { payments: true }
    })

    if (!existingPurchase) {
      return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { supplierId, rawMaterialId, quantity, totalAmount, purchaseDate } = body

    // Validation
    if (!supplierId || !rawMaterialId || !quantity || !totalAmount || !purchaseDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert to numbers
    const qtyNum = parseFloat(quantity)
    const totalNum = parseFloat(totalAmount)

    // Validate numbers
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(totalNum) || totalNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Total amount must be a positive number' },
        { status: 400 }
      )
    }

    // Calculate existing total paid from payment records
    const totalPaidFromPayments = existingPurchase.payments.reduce((sum: number, payment: any) => {
      return sum + Number(payment.amount)
    }, 0)

    // Validate that total amount is not less than already paid
    if (totalNum < totalPaidFromPayments) {
      return NextResponse.json(
        { success: false, error: `Total amount cannot be less than already paid amount (₦${totalPaidFromPayments.toFixed(2)})` },
        { status: 400 }
      )
    }

    // Recalculate balance
    const balanceNum = totalNum - totalPaidFromPayments

    // Determine status
    let status = 'pending'

    if (totalPaidFromPayments === 0) {
      status = 'pending'
    } else if (totalPaidFromPayments > 0 && totalPaidFromPayments < totalNum) {
      status = 'partial'
    } else if (totalPaidFromPayments >= totalNum) {
      status = 'paid'
    }

    // Update purchase
    const purchase = await prisma.purchase.update({
      where: { id },
      data: {
        supplierId,
        rawMaterialId,
        quantity: qtyNum,
        totalAmount: totalNum,
        amountPaid: totalPaidFromPayments,
        balance: balanceNum,
        purchaseDate: new Date(purchaseDate),
        status
      },
      include: {
        supplier: true,
        rawMaterial: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    })

    // Convert Decimal fields to numbers
    const purchaseData = {
      ...purchase,
      quantity: Number(purchase.quantity),
      totalAmount: Number(purchase.totalAmount),
      amountPaid: Number(purchase.amountPaid),
      balance: Number(purchase.balance),
      payments: purchase.payments.map((payment: any) => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    }

    return NextResponse.json({
      success: true,
      data: purchaseData,
      message: 'Purchase updated successfully'
    })
  } catch (error) {
    console.error('Error updating purchase:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to update purchase' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/purchases/[id]
 * Delete a purchase
 */
export async function DELETE(
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

    // Permission check (only admin or procurement can delete)
    if (!hasPermission(payload.role as any, Resource.PURCHASES, Action.DELETE)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if purchase exists
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: { payments: true }
    })

    if (!existingPurchase) {
      return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 })
    }

    // Prevent deletion if payments exist
    if (existingPurchase.payments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete purchase with payment history' },
        { status: 400 }
      )
    }

    // Delete purchase
    await prisma.purchase.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Purchase deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting purchase:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to delete purchase' },
      { status: 500 }
    )
  }
}
