import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'

/**
 * Get customer outstanding balance
 * GET /api/customers/[id]/outstanding
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(payload.role as any, Resource.CUSTOMERS, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    // Get customer with outstanding sales
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        customerCode: true,
        businessName: true,
        creditBalance: true
      }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Calculate total outstanding balance from all sales
    const outstandingSales = await prisma.sale.findMany({
      where: {
        customerId: id,
        balance: {
          gt: 0
        }
      },
      select: {
        id: true,
        balance: true,
        total: true,
        supplyDate: true,
        status: true
      },
      orderBy: {
        supplyDate: 'asc'
      }
    })

    const totalOutstanding = outstandingSales.reduce(
      (sum, sale) => sum + parseFloat(sale.balance.toString()),
      0
    )

    const creditBalance = parseFloat(customer.creditBalance.toString())

    return NextResponse.json({
      success: true,
      data: {
        customerId: customer.id,
        customerCode: customer.customerCode,
        businessName: customer.businessName,
        totalOutstanding,
        creditBalance,
        netBalance: totalOutstanding - creditBalance, // Positive = owes money, Negative = has credit
        salesWithBalance: outstandingSales.length,
        outstandingSales: outstandingSales.map(sale => ({
          id: sale.id,
          balance: parseFloat(sale.balance.toString()),
          total: parseFloat(sale.total.toString()),
          supplyDate: sale.supplyDate,
          status: sale.status
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching customer outstanding:', error)

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
