import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import prisma from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/reports/customers
 * Get customer list report with optional filters
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
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { customerCode: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    // Build orderBy clause
    const orderBy: any = {}

    if (sortBy === 'customerCode') {
      orderBy.customerCode = sortOrder
    } else if (sortBy === 'businessName') {
      orderBy.businessName = sortOrder
    } else if (sortBy === 'location') {
      orderBy.location = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    // Fetch customers with sales aggregation
    const customers = await prisma.customer.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: { sales: true }
        },
        sales: {
          select: {
            totalAmount: true,
            balance: true
          }
        }
      }
    })

    // Calculate totals for each customer
    const customersData = customers.map((customer: any) => {
      const totalSales = customer.sales.reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0)
      const totalOutstanding = customer.sales.reduce((sum: number, sale: any) => sum + Number(sale.balance), 0)

      return {
        id: customer.id,
        customerCode: customer.customerCode,
        businessName: customer.businessName,
        contactPerson: customer.contactPerson,
        phone: customer.phone,
        location: customer.location,
        createdAt: customer.createdAt,
        totalTransactions: customer._count.sales,
        totalSales,
        totalOutstanding
      }
    })

    // Calculate grand totals
    const summary = {
      totalCustomers: customersData.length,
      totalTransactions: customersData.reduce((sum: number, c: any) => sum + c.totalTransactions, 0),
      totalSales: customersData.reduce((sum: number, c: any) => sum + c.totalSales, 0),
      totalOutstanding: customersData.reduce((sum: number, c: any) => sum + c.totalOutstanding, 0)
    }

    return NextResponse.json({
      success: true,
      data: customersData,
      summary
    })
  } catch (error) {
    console.error('Error fetching customer report:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer report' },
      { status: 500 }
    )
  }
}
