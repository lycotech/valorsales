import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import prisma from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/reports/sales-by-product
 * Get sales report grouped by product
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
    const sortBy = searchParams.get('sortBy') || 'revenue'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    // Date range filter
    if (startDate || endDate) {
      where.supplyDate = {}

      if (startDate) where.supplyDate.gte = new Date(startDate)
      if (endDate) where.supplyDate.lte = new Date(endDate)
    }

    // Fetch all sales with product info
    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            productCode: true,
            productName: true
          }
        }
      }
    })

    // Group sales by product
    const productMap = new Map<string, any>()

    sales.forEach((sale: any) => {
      const { product } = sale
      const productId = product.id

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId: product.id,
          productCode: product.productCode,
          productName: product.productName,
          totalQuantitySold: 0,
          totalSales: 0,
          totalRevenue: 0,
          totalOutstanding: 0,
          salesCount: 0
        })
      }

      const productData = productMap.get(productId)

      productData.totalQuantitySold += Number(sale.quantity)
      productData.totalSales += 1
      productData.totalRevenue += Number(sale.totalAmount)
      productData.totalOutstanding += Number(sale.balance)
      productData.salesCount += 1
    })

    // Convert Map to array
    let productSales = Array.from(productMap.values())

    // Sort by selected criteria
    if (sortBy === 'revenue') {
      productSales = productSales.sort((a, b) =>
        sortOrder === 'asc' ? a.totalRevenue - b.totalRevenue : b.totalRevenue - a.totalRevenue
      )
    } else if (sortBy === 'quantity') {
      productSales = productSales.sort((a, b) =>
        sortOrder === 'asc' ? a.totalQuantitySold - b.totalQuantitySold : b.totalQuantitySold - a.totalQuantitySold
      )
    } else if (sortBy === 'sales') {
      productSales = productSales.sort((a, b) =>
        sortOrder === 'asc' ? a.salesCount - b.salesCount : b.salesCount - a.salesCount
      )
    }

    // Calculate grand totals
    const summary = {
      totalProducts: productSales.length,
      totalTransactions: productSales.reduce((sum: number, p: any) => sum + p.salesCount, 0),
      totalQuantitySold: productSales.reduce((sum: number, p: any) => sum + p.totalQuantitySold, 0),
      totalRevenue: productSales.reduce((sum: number, p: any) => sum + p.totalRevenue, 0),
      totalOutstanding: productSales.reduce((sum: number, p: any) => sum + p.totalOutstanding, 0)
    }

    return NextResponse.json({
      success: true,
      data: productSales,
      summary
    })
  } catch (error) {
    console.error('Error fetching sales by product report:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales by product report' },
      { status: 500 }
    )
  }
}
