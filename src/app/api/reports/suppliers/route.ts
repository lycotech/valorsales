import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { prisma } from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/reports/suppliers
 * Get supplier list report with raw materials and purchase data
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
        { supplierCode: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    if (location) {
      where.location = { contains: location }
    }

    // Build orderBy clause
    const orderBy: any = {}

    if (sortBy === 'supplierCode') {
      orderBy.supplierCode = sortOrder
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'location') {
      orderBy.location = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    // Fetch suppliers with raw materials and purchases
    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy,
      include: {
        items: {
          select: {
            id: true,
            itemCode: true,
            itemName: true
          }
        },
        _count: {
          select: { purchases: true }
        },
        purchases: {
          select: {
            totalAmount: true,
            balance: true
          }
        }
      }
    })

    // Format suppliers data
    const suppliersData = suppliers.map((supplier: any) => {
      const totalPurchases = supplier.purchases.reduce((sum: number, purchase: any) => sum + Number(purchase.totalAmount), 0)
      const totalOutstanding = supplier.purchases.reduce((sum: number, purchase: any) => sum + Number(purchase.balance), 0)

      return {
        id: supplier.id,
        supplierCode: supplier.supplierCode,
        name: supplier.name,
        phone: supplier.phone,
        location: supplier.location,
        createdAt: supplier.createdAt,
        rawMaterials: supplier.items,
        totalMaterials: supplier.items.length,
        totalTransactions: supplier._count.purchases,
        totalPurchases,
        totalOutstanding
      }
    })

    // Calculate grand totals
    const summary = {
      totalSuppliers: suppliersData.length,
      totalMaterials: suppliersData.reduce((sum: number, s: any) => sum + s.totalMaterials, 0),
      totalTransactions: suppliersData.reduce((sum: number, s: any) => sum + s.totalTransactions, 0),
      totalPurchases: suppliersData.reduce((sum: number, s: any) => sum + s.totalPurchases, 0),
      totalOutstanding: suppliersData.reduce((sum: number, s: any) => sum + s.totalOutstanding, 0)
    }

    return NextResponse.json({
      success: true,
      data: suppliersData,
      summary
    })
  } catch (error) {
    console.error('Error fetching supplier report:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch supplier report' },
      { status: 500 }
    )
  }
}
