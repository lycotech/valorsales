import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import prisma from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/reports/total-sales
 * Get total sales report with aggregation by period and payment method
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

    // Date range filter
    if (startDate || endDate) {
      where.supplyDate = {}

      if (startDate) where.supplyDate.gte = new Date(startDate)
      if (endDate) where.supplyDate.lte = new Date(endDate)
    }

    // Fetch all sales
    const sales = await prisma.sale.findMany({
      where,
      orderBy: { supplyDate: 'asc' }
    })

    // Group sales by payment method
    const paymentMethodMap = new Map<string, any>()

    sales.forEach((sale: any) => {
      const method = sale.paymentMode

      if (!paymentMethodMap.has(method)) {
        paymentMethodMap.set(method, {
          paymentMode: method,
          totalSales: 0,
          totalAmount: 0,
          salesCount: 0
        })
      }

      const methodData = paymentMethodMap.get(method)

      methodData.salesCount += 1
      methodData.totalAmount += Number(sale.totalAmount)
    })

    const paymentMethodBreakdown = Array.from(paymentMethodMap.values())

    // Group sales by date period
    const periodMap = new Map<string, any>()

    sales.forEach((sale: any) => {
      const date = new Date(sale.supplyDate)
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
          totalSales: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          salesCount: 0
        })
      }

      const periodData = periodMap.get(periodKey)

      periodData.salesCount += 1
      periodData.totalAmount += Number(sale.totalAmount)
      periodData.totalPaid += Number(sale.amountPaid)
      periodData.totalOutstanding += Number(sale.balance)
    })

    const periodBreakdown = Array.from(periodMap.values())

    // Calculate grand totals
    const summary = {
      totalTransactions: sales.length,
      totalRevenue: sales.reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0),
      totalPaid: sales.reduce((sum: number, sale: any) => sum + Number(sale.amountPaid), 0),
      totalOutstanding: sales.reduce((sum: number, sale: any) => sum + Number(sale.balance), 0),
      totalQuantitySold: sales.reduce((sum: number, sale: any) => sum + Number(sale.quantity), 0)
    }

    return NextResponse.json({
      success: true,
      summary,
      paymentMethodBreakdown,
      periodBreakdown
    })
  } catch (error) {
    console.error('Error fetching total sales report:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch total sales report' },
      { status: 500 }
    )
  }
}
