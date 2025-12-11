/**
 * Dashboard Charts API
 * GET /api/dashboard/charts
 * Returns chart data for dashboard display
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    // Parallel queries
    const [monthlySalesRaw, topProductsRaw, recentSales, recentPurchases] = await Promise.all([
      // Monthly sales trend (last 6 months) using raw SQL for date grouping
      prisma.$queryRaw`
        SELECT
          DATE_FORMAT(supplyDate, '%Y-%m') as month,
          DATE_FORMAT(supplyDate, '%b %Y') as monthLabel,
          CAST(SUM(total) AS DECIMAL(15,2)) as total,
          COUNT(*) as count
        FROM sales
        WHERE supplyDate >= ${sixMonthsAgo}
        GROUP BY DATE_FORMAT(supplyDate, '%Y-%m'), DATE_FORMAT(supplyDate, '%b %Y')
        ORDER BY month ASC
      `,

      // Top 5 products by revenue this month
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: {
            supplyDate: { gte: startOfMonth }
          }
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5
      }),

      // Recent sales (last 10)
      prisma.sale.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { businessName: true } },
          items: {
            take: 3,
            include: {
              product: { select: { productName: true } }
            }
          }
        }
      }),

      // Recent purchases (last 10)
      prisma.purchase.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { name: true } },
          rawMaterial: { select: { materialName: true } }
        }
      })
    ])

    // Get product names for top products
    const productIds = topProductsRaw.map(p => p.productId)

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productName: true, productCode: true }
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    // Format monthly sales trend
    const monthlySales = (monthlySalesRaw as any[]).map(m => ({
      month: m.month,
      label: m.monthLabel,
      total: Number(m.total) || 0,
      count: Number(m.count) || 0
    }))

    // Format top products
    const topProducts = topProductsRaw.map(p => ({
      productId: p.productId,
      productName: productMap.get(p.productId)?.productName || 'Unknown',
      productCode: productMap.get(p.productId)?.productCode || '',
      quantitySold: Number(p._sum.quantity) || 0,
      totalRevenue: Number(p._sum.total) || 0
    }))

    // Format recent transactions
    const formattedRecentSales = recentSales.map(sale => ({
      id: sale.id,
      type: 'sale' as const,
      code: sale.saleCode,
      description: sale.customer.businessName,
      products:
        sale.items
          .map(i => i.product.productName)
          .slice(0, 2)
          .join(', ') + (sale.items.length > 2 ? ` +${sale.items.length - 2} more` : ''),
      amount: Number(sale.total),
      status: sale.status,
      date: sale.createdAt
    }))

    const formattedRecentPurchases = recentPurchases.map(purchase => ({
      id: purchase.id,
      type: 'purchase' as const,
      code: `PUR-${purchase.id.slice(-6).toUpperCase()}`,
      description: purchase.supplier.name,
      products: purchase.rawMaterial.materialName,
      amount: Number(purchase.totalAmount),
      status: purchase.status,
      date: purchase.createdAt
    }))

    // Combine and sort recent transactions
    const recentTransactions = [...formattedRecentSales, ...formattedRecentPurchases]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        monthlySales,
        topProducts,
        recentTransactions
      }
    })
  } catch (error) {
    console.error('Dashboard charts error:', error)

    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard charts' }, { status: 500 })
  }
}
