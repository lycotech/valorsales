import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import prisma from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/reports/total-expenses
 * Get total expense (purchases) report with aggregation by period and payment method
 */
export async function GET(request: NextRequest) {
  try {
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
    if (!hasPermission(payload.role as any, Resource.REPORTS, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    // Query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'day'

    // Build where clause
    const where: any = {}

    if (startDate || endDate) {
      where.purchaseDate = {}

      if (startDate) where.purchaseDate.gte = new Date(startDate)
      if (endDate) where.purchaseDate.lte = new Date(endDate)
    }

    // Fetch all purchases with supplier & raw material info
    const purchases = await prisma.purchase.findMany({
      where,
      orderBy: { purchaseDate: 'asc' },
      include: {
        supplier: {
          select: { id: true, name: true, supplierCode: true }
        },
        rawMaterial: {
          select: { id: true, materialName: true, materialCode: true }
        },
        payments: {
          select: { paymentMode: true, amount: true }
        }
      }
    })

    // ---- Payment method breakdown (based on actual payments made) ----
    const paymentMethodMap = new Map<string, { paymentMode: string; purchaseCount: number; totalAmount: number }>()

    purchases.forEach((purchase: any) => {
      if (purchase.payments && purchase.payments.length > 0) {
        purchase.payments.forEach((payment: any) => {
          const mode = payment.paymentMode

          if (!paymentMethodMap.has(mode)) {
            paymentMethodMap.set(mode, { paymentMode: mode, purchaseCount: 0, totalAmount: 0 })
          }

          const d = paymentMethodMap.get(mode)!

          d.purchaseCount += 1
          d.totalAmount += Number(payment.amount)
        })
      } else {
        // Purchase with no payment recorded yet
        const mode = 'unpaid'

        if (!paymentMethodMap.has(mode)) {
          paymentMethodMap.set(mode, { paymentMode: mode, purchaseCount: 0, totalAmount: 0 })
        }

        const d = paymentMethodMap.get(mode)!

        d.purchaseCount += 1
        d.totalAmount += Number(purchase.totalAmount)
      }
    })

    const paymentMethodBreakdown = Array.from(paymentMethodMap.values())

    // ---- Supplier breakdown ----
    const supplierMap = new Map<string, { supplierId: string; supplierName: string; purchaseCount: number; totalAmount: number }>()

    purchases.forEach((purchase: any) => {
      const sid = purchase.supplier.id
      const sname = `${purchase.supplier.supplierCode} - ${purchase.supplier.name}`

      if (!supplierMap.has(sid)) {
        supplierMap.set(sid, { supplierId: sid, supplierName: sname, purchaseCount: 0, totalAmount: 0 })
      }

      const d = supplierMap.get(sid)!

      d.purchaseCount += 1
      d.totalAmount += Number(purchase.totalAmount)
    })

    const supplierBreakdown = Array.from(supplierMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)

    // ---- Period breakdown ----
    const periodMap = new Map<string, {
      period: string
      purchaseCount: number
      totalAmount: number
      totalPaid: number
      totalOutstanding: number
      totalQuantity: number
    }>()

    purchases.forEach((purchase: any) => {
      const date = new Date(purchase.purchaseDate)
      let periodKey = ''

      if (groupBy === 'day') {
        periodKey = date.toISOString().split('T')[0]
      } else if (groupBy === 'week') {
        const weekStart = new Date(date)

        weekStart.setDate(date.getDate() - date.getDay())
        periodKey = weekStart.toISOString().split('T')[0]
      } else if (groupBy === 'month') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else if (groupBy === 'year') {
        periodKey = String(date.getFullYear())
      }

      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          period: periodKey,
          purchaseCount: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalQuantity: 0
        })
      }

      const d = periodMap.get(periodKey)!

      d.purchaseCount += 1
      d.totalAmount += Number(purchase.totalAmount)
      d.totalPaid += Number(purchase.amountPaid)
      d.totalOutstanding += Number(purchase.balance)
      d.totalQuantity += Number(purchase.quantity)
    })

    const periodBreakdown = Array.from(periodMap.values())

    // ---- Grand totals ----
    const summary = {
      totalTransactions: purchases.length,
      totalExpense: purchases.reduce((s: number, p: any) => s + Number(p.totalAmount), 0),
      totalPaid: purchases.reduce((s: number, p: any) => s + Number(p.amountPaid), 0),
      totalOutstanding: purchases.reduce((s: number, p: any) => s + Number(p.balance), 0),
      totalQuantityPurchased: purchases.reduce((s: number, p: any) => s + Number(p.quantity), 0),
      uniqueSuppliers: new Set(purchases.map((p: any) => p.supplierId)).size
    }

    return NextResponse.json({
      success: true,
      summary,
      paymentMethodBreakdown,
      supplierBreakdown,
      periodBreakdown
    })
  } catch (error) {
    console.error('Error fetching total expense report:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch total expense report' },
      { status: 500 }
    )
  }
}
