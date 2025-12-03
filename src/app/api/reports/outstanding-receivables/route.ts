import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import prisma from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/reports/outstanding-receivables
 * Get outstanding payments (receivables) from customers
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
    const status = searchParams.get('status') || 'all'
    const agingDays = searchParams.get('agingDays') || '0'

    // Build where clause
    const where: any = {
      balance: { gt: 0 } // Only sales with outstanding balance
    }

    // Status filter
    if (status === 'partial') {
      where.status = 'partial'
    } else if (status === 'pending') {
      where.status = 'pending'
    }

    // Date range filter
    if (startDate || endDate) {
      where.supplyDate = {}

      if (startDate) where.supplyDate.gte = new Date(startDate)
      if (endDate) where.supplyDate.lte = new Date(endDate)
    }

    // Aging filter
    if (parseInt(agingDays) > 0) {
      const agingDate = new Date()

      agingDate.setDate(agingDate.getDate() - parseInt(agingDays))
      where.supplyDate = { ...where.supplyDate, lte: agingDate }
    }

    // Fetch sales with outstanding balances
    const sales = await prisma.sale.findMany({
      where,
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
            productName: true
          }
        },
        payments: {
          select: {
            amount: true,
            paymentDate: true
          },
          orderBy: { paymentDate: 'desc' }
        }
      },
      orderBy: { supplyDate: 'desc' }
    })

    // Group sales by customer
    const customerMap = new Map<string, any>()

    sales.forEach((sale: any) => {
      const { customer } = sale
      const customerId = customer.id

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId: customer.id,
          customerCode: customer.customerCode,
          customerName: customer.businessName,
          phone: customer.phone,
          location: customer.location,
          totalSales: 0,
          totalPaid: 0,
          totalReceivable: 0,
          salesCount: 0,
          sales: []
        })
      }

      const customerData = customerMap.get(customerId)

      // Calculate aging days
      const agingDays = Math.floor(
        (new Date().getTime() - new Date(sale.supplyDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      customerData.salesCount += 1
      customerData.totalSales += Number(sale.totalAmount)
      customerData.totalPaid += Number(sale.amountPaid)
      customerData.totalReceivable += Number(sale.balance)
      customerData.sales.push({
        id: sale.id,
        supplyDate: sale.supplyDate,
        productId: sale.product.id,
        productCode: sale.product.productCode,
        productName: sale.product.productName,
        quantity: Number(sale.quantity),
        totalAmount: Number(sale.totalAmount),
        amountPaid: Number(sale.amountPaid),
        balance: Number(sale.balance),
        status: sale.status,
        agingDays,
        lastPaymentDate: sale.payments[0]?.paymentDate || null
      })
    })

    // Convert Map to array and sort by receivable amount (descending)
    const customerReceivables = Array.from(customerMap.values()).sort(
      (a, b) => b.totalReceivable - a.totalReceivable
    )

    // Calculate grand totals
    const summary = {
      totalCustomers: customerReceivables.length,
      totalSales: customerReceivables.reduce((sum: number, c: any) => sum + c.salesCount, 0),
      totalAmount: customerReceivables.reduce((sum: number, c: any) => sum + c.totalSales, 0),
      totalPaid: customerReceivables.reduce((sum: number, c: any) => sum + c.totalPaid, 0),
      totalReceivable: customerReceivables.reduce((sum: number, c: any) => sum + c.totalReceivable, 0)
    }

    return NextResponse.json({
      success: true,
      data: customerReceivables,
      summary
    })
  } catch (error) {
    console.error('Error fetching outstanding receivables:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch outstanding receivables' },
      { status: 500 }
    )
  }
}
