import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'

/**
 * Get customers with credit balances
 * GET /api/customers/credits?search=keyword
 */
export async function GET(request: NextRequest) {
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
    if (!hasPermission(payload.role as any, Resource.SALES, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''

    // Build where clause - only customers with credit balance > 0
    const where: any = {
      creditBalance: {
        gt: 0
      }
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { customerCode: { contains: search } },
        { phone: { contains: search } },
        { location: { contains: search } }
      ]
    }

    // Fetch customers with credit balance
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        customerCode: true,
        businessName: true,
        phone: true,
        location: true,
        creditBalance: true
      },
      orderBy: {
        creditBalance: 'desc'
      }
    })

    // Calculate total credits
    const totalCredits = customers.reduce(
      (sum, c) => sum + parseFloat(c.creditBalance.toString()),
      0
    )

    return NextResponse.json({
      success: true,
      data: customers.map(c => ({
        ...c,
        creditBalance: parseFloat(c.creditBalance.toString())
      })),
      totalCredits,
      count: customers.length
    })
  } catch (error) {
    console.error('Error fetching customer credits:', error)

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
