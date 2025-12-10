import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * GET /api/dashboard/stats
 * Fetch dashboard statistics including sales, purchases, receivables, payables, and inventory alerts
 */
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

    // Calculate date range for trends (last 30 days vs previous 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Fetch all statistics in parallel
    const [
      currentSales,
      previousSales,
      currentPurchases,
      previousPurchases,
      outstandingReceivables,
      outstandingPayables,
      lowStockProducts,
      outOfStockProducts,
      lowStockMaterials,
      outOfStockMaterials,
      totalCustomers,
      activeCustomers,
      totalProducts
    ] = await Promise.all([
      // Current period sales (last 30 days)
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _sum: {
          total: true
        },
        _count: true
      }),

      // Previous period sales (30-60 days ago)
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        },
        _sum: {
          total: true
        }
      }),

      // Current period purchases (last 30 days)
      prisma.purchase.aggregate({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: true
      }),

      // Previous period purchases (30-60 days ago)
      prisma.purchase.aggregate({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Outstanding receivables (unpaid or partially paid sales)
      prisma.sale.aggregate({
        where: {
          status: {
            in: ['pending', 'partial']
          }
        },
        _sum: {
          balance: true
        },
        _count: true
      }),

      // Outstanding payables (unpaid or partially paid purchases)
      prisma.purchase.aggregate({
        where: {
          status: {
            in: ['pending', 'partial']
          }
        },
        _sum: {
          balance: true
        },
        _count: true
      }),

      // Low stock products (quantity <= reorderPoint but > 0)
      prisma.productInventory.count({
        where: {
          quantity: {
            gt: 0,
            lte: prisma.productInventory.fields.reorderPoint
          }
        }
      }),

      // Out of stock products (quantity = 0)
      prisma.productInventory.count({
        where: {
          quantity: 0
        }
      }),

      // Low stock raw materials (quantity <= reorderPoint but > 0)
      prisma.rawMaterialInventory.count({
        where: {
          quantity: {
            gt: 0,
            lte: prisma.rawMaterialInventory.fields.reorderPoint
          }
        }
      }),

      // Out of stock raw materials (quantity = 0)
      prisma.rawMaterialInventory.count({
        where: {
          quantity: 0
        }
      }),

      // Total customers
      prisma.customer.count(),

      // Active customers (customers with at least one sale in last 90 days)
      prisma.customer.count({
        where: {
          sales: {
            some: {
              createdAt: {
                gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),

      // Total products
      prisma.product.count()
    ])

    // Calculate trends (percentage change)
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0

      return Math.round(((current - previous) / previous) * 100)
    }

    const currentSalesAmount = Number(currentSales._sum?.total || 0)
    const previousSalesAmount = Number(previousSales._sum?.total || 0)
    const currentPurchasesAmount = Number(currentPurchases._sum?.totalAmount || 0)
    const previousPurchasesAmount = Number(previousPurchases._sum?.totalAmount || 0)

    const stats = {
      totalSales: {
        amount: currentSalesAmount,
        count: currentSales._count,
        trend: calculateTrend(currentSalesAmount, previousSalesAmount)
      },
      totalPurchases: {
        amount: currentPurchasesAmount,
        count: currentPurchases._count,
        trend: calculateTrend(currentPurchasesAmount, previousPurchasesAmount)
      },
      outstandingReceivables: {
        amount: Number(outstandingReceivables._sum.balance || 0),
        count: outstandingReceivables._count
      },
      outstandingPayables: {
        amount: Number(outstandingPayables._sum.balance || 0),
        count: outstandingPayables._count
      },
      inventory: {
        lowStockProducts,
        lowStockMaterials,
        outOfStockProducts,
        outOfStockMaterials
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers
      },
      products: {
        total: totalProducts,
        active: totalProducts // Assuming all products are active for now
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics'
      },
      { status: 500 }
    )
  }
}
