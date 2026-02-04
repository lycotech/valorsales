import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission } from '@/lib/auth/permissions'
import { Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/reports/profit-loss
 * Generate Profit & Loss report for a date range
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid token' }, { status: 401 })
    }

    // 2. Check permissions - require read access to sales, purchases, and expenses
    const canReadSales = hasPermission(payload.role as any, Resource.SALES, Action.READ)
    const canReadPurchases = hasPermission(payload.role as any, Resource.PURCHASES, Action.READ)

    if (!canReadSales || !canReadPurchases) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Start date and end date are required'
        },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // 4. Fetch Revenue (Sales)
    const sales = await prisma.sale.findMany({
      where: {
        supplyDate: {
          gte: start,
          lte: end
        }
      },
      select: {
        id: true,
        saleCode: true,
        total: true,
        supplyDate: true,
        customer: {
          select: {
            businessName: true
          }
        }
      },
      orderBy: { supplyDate: 'desc' }
    })

    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0)

    // 5. Fetch COGS (Purchases)
    const purchases = await prisma.purchase.findMany({
      where: {
        purchaseDate: {
          gte: start,
          lte: end
        }
      },
      select: {
        id: true,
        totalAmount: true,
        purchaseDate: true,
        supplier: {
          select: {
            name: true
          }
        },
        rawMaterial: {
          select: {
            materialName: true
          }
        }
      },
      orderBy: { purchaseDate: 'desc' }
    })

    const totalCOGS = purchases.reduce((sum: number, purchase) => sum + parseFloat(purchase.totalAmount.toString()), 0)

    // 6. Calculate Gross Profit
    const grossProfit = totalRevenue - totalCOGS
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // 7. Fetch Operating Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    const totalExpenses = expenses.reduce((sum: number, expense) => sum + parseFloat(expense.amount.toString()), 0)

    // Group expenses by category
    const expensesByCategory = expenses.reduce(
      (acc: Record<string, { categoryId: string; categoryName: string; amount: number }>, expense) => {
        const categoryName = expense.category?.name || 'Uncategorized'
        const categoryId = expense.category?.id || 'uncategorized'

        if (!acc[categoryId]) {
          acc[categoryId] = {
            categoryId,
            categoryName,
            amount: 0
          }
        }

        acc[categoryId].amount += parseFloat(expense.amount.toString())

        return acc
      },
      {} as Record<string, { categoryId: string; categoryName: string; amount: number }>
    )

    const expenseCategoryBreakdown = Object.values(expensesByCategory).sort((a, b) => b.amount - a.amount)

    // 8. Calculate Net Profit
    const netProfit = grossProfit - totalExpenses
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // 9. Format response
    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        revenue: {
          total: totalRevenue,
          breakdown: sales.map(sale => ({
            id: sale.id,
            saleCode: sale.saleCode,
            date: sale.supplyDate,
            customer: sale.customer.businessName,
            amount: parseFloat(sale.total.toString())
          }))
        },
        cogs: {
          total: totalCOGS,
          breakdown: purchases.map(purchase => ({
            id: purchase.id,
            date: purchase.purchaseDate,
            supplier: purchase.supplier.name,
            material: purchase.rawMaterial.materialName,
            amount: parseFloat(purchase.totalAmount.toString())
          }))
        },
        grossProfit,
        grossProfitMargin: parseFloat(grossProfitMargin.toFixed(2)),
        expenses: {
          total: totalExpenses,
          byCategory: expenseCategoryBreakdown,
          breakdown: expenses.map(expense => ({
            id: expense.id,
            date: expense.date,
            category: expense.category?.name || 'Uncategorized',
            description: expense.description,
            amount: parseFloat(expense.amount.toString())
          }))
        },
        netProfit,
        netProfitMargin: parseFloat(netProfitMargin.toFixed(2))
      }
    })
  } catch (error) {
    console.error('Error generating P&L report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An error occurred'
      },
      { status: 500 }
    )
  }
}
