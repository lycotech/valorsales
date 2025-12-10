import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'

/**
 * Get customer outstanding balances report
 * GET /api/reports/customer-outstanding?startDate=2024-01-01&endDate=2024-12-31
 */
export async function GET(request: NextRequest) {
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

    // Check permissions - Admin, Sales, and Management can view reports
    if (!hasPermission(payload.role as any, Resource.REPORTS, Action.READ)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status') || 'all' // all, partial, pending

    // Build where clause
    const where: any = {}

    // Filter by balance > 0 if not showing all
    if (status === 'partial') {
      where.status = 'partial'
      where.balance = { gt: 0 }
    } else if (status === 'pending') {
      where.status = 'pending'
      where.balance = { gt: 0 }
    } else {
      // For 'all', show any sale with balance > 0
      where.balance = { gt: 0 }
    }

    // Date range filter
    if (startDate || endDate) {
      where.supplyDate = {}

      if (startDate) {
        where.supplyDate.gte = new Date(startDate)
      }

      if (endDate) {
        where.supplyDate.lte = new Date(endDate)
      }
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
            location: true,
            creditBalance: true
          }
        }
      },
      orderBy: {
        supplyDate: 'desc'
      }
    })

    // Group by customer and calculate totals
    const customerMap = new Map<
      string,
      {
        customerId: string
        customerCode: string
        customerName: string
        phone: string
        location: string
        creditBalance: number
        totalSales: number
        totalAmount: number
        totalPaid: number
        totalOutstanding: number
        netBalance: number
        salesCount: number
        sales: any[]
      }
    >()

    sales.forEach((sale: any) => {
      const customerId = sale.customerId
      const total = parseFloat(sale.total.toString())
      const paid = parseFloat(sale.amountPaid.toString())
      const balance = parseFloat(sale.balance.toString())

      if (!customerMap.has(customerId)) {
        const creditBal = parseFloat(sale.customer.creditBalance?.toString() || '0')

        customerMap.set(customerId, {
          customerId: sale.customer.id,
          customerCode: sale.customer.customerCode,
          customerName: sale.customer.businessName,
          phone: sale.customer.phone,
          location: sale.customer.location,
          creditBalance: creditBal,
          totalSales: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          netBalance: 0,
          salesCount: 0,
          sales: []
        })
      }

      const customerData = customerMap.get(customerId)!

      customerData.salesCount += 1
      customerData.totalAmount += total
      customerData.totalPaid += paid
      customerData.totalOutstanding += balance
      customerData.netBalance = customerData.totalOutstanding - customerData.creditBalance
      customerData.sales.push({
        id: sale.id,
        supplyDate: sale.supplyDate,
        productId: sale.productId,
        quantity: parseFloat(sale.quantity.toString()),
        price: parseFloat(sale.price.toString()),
        total,
        amountPaid: paid,
        balance,
        status: sale.status,
        paymentMode: sale.paymentMode
      })
    })

    // Convert map to array and sort by outstanding amount
    const customerOutstanding = Array.from(customerMap.values()).sort(
      (a, b) => b.totalOutstanding - a.totalOutstanding
    )

    // Calculate grand totals
    const grandTotal = {
      totalCustomers: customerOutstanding.length,
      totalSales: customerOutstanding.reduce((sum, c) => sum + c.salesCount, 0),
      totalAmount: customerOutstanding.reduce((sum, c) => sum + c.totalAmount, 0),
      totalPaid: customerOutstanding.reduce((sum, c) => sum + c.totalPaid, 0),
      totalOutstanding: customerOutstanding.reduce((sum, c) => sum + c.totalOutstanding, 0)
    }

    return NextResponse.json({
      success: true,
      data: customerOutstanding,
      summary: grandTotal
    })
  } catch (error) {
    console.error('Error fetching customer outstanding report:', error)

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
