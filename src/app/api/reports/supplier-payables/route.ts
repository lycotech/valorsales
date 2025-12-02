import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import prisma from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/reports/supplier-payables
 * Get outstanding payables grouped by supplier
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

    // Build where clause
    const where: any = {
      balance: { gt: 0 } // Only purchases with outstanding balance
    }

    // Status filter
    if (status === 'partial') {
      where.status = 'partial'
    } else if (status === 'pending') {
      where.status = 'pending'
    }

    // Date range filter
    if (startDate || endDate) {
      where.purchaseDate = {}

      if (startDate) where.purchaseDate.gte = new Date(startDate)
      if (endDate) where.purchaseDate.lte = new Date(endDate)
    }

    // Fetch purchases with outstanding balances
    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            supplierCode: true,
            name: true,
            phone: true,
            location: true
          }
        },
        rawMaterial: {
          select: {
            id: true,
            materialCode: true,
            materialName: true
          }
        }
      },
      orderBy: { purchaseDate: 'desc' }
    })

    // Group purchases by supplier
    const supplierMap = new Map<string, any>()

    purchases.forEach((purchase: any) => {
      const { supplier } = purchase
      const supplierId = supplier.id

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplierId: supplier.id,
          supplierCode: supplier.supplierCode,
          supplierName: supplier.name,
          phone: supplier.phone,
          location: supplier.location,
          totalPurchases: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalPayable: 0,
          purchasesCount: 0,
          purchases: []
        })
      }

      const supplierData = supplierMap.get(supplierId)

      supplierData.purchasesCount += 1
      supplierData.totalAmount += Number(purchase.totalAmount)
      supplierData.totalPaid += Number(purchase.amountPaid)
      supplierData.totalPayable += Number(purchase.balance)
      supplierData.purchases.push({
        id: purchase.id,
        purchaseDate: purchase.purchaseDate,
        rawMaterialId: purchase.rawMaterial.id,
        rawMaterialCode: purchase.rawMaterial.materialCode,
        rawMaterialName: purchase.rawMaterial.materialName,
        quantity: Number(purchase.quantity),
        totalAmount: Number(purchase.totalAmount),
        amountPaid: Number(purchase.amountPaid),
        balance: Number(purchase.balance),
        status: purchase.status
      })
    })

    // Convert Map to array and sort by payable amount (descending)
    const supplierPayables = Array.from(supplierMap.values()).sort((a, b) => b.totalPayable - a.totalPayable)

    // Calculate grand totals
    const summary = {
      totalSuppliers: supplierPayables.length,
      totalPurchases: supplierPayables.reduce((sum: number, s: any) => sum + s.purchasesCount, 0),
      totalAmount: supplierPayables.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      totalPaid: supplierPayables.reduce((sum: number, s: any) => sum + s.totalPaid, 0),
      totalPayable: supplierPayables.reduce((sum: number, s: any) => sum + s.totalPayable, 0)
    }

    return NextResponse.json({
      success: true,
      data: supplierPayables,
      summary
    })
  } catch (error) {
    console.error('Error fetching supplier payables:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch supplier payables' },
      { status: 500 }
    )
  }
}
