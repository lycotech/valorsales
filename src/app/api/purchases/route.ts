import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import prisma from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'

/**
 * GET /api/purchases
 * Get all purchases with filters and pagination
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
    if (!hasPermission(payload.role as any, Resource.PURCHASES, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    // Query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const supplierId = searchParams.get('supplierId') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Search filter (supplier name/code, raw material name/code)
    if (search) {
      where.OR = [
        { supplier: { name: { contains: search } } },
        { supplier: { supplierCode: { contains: search } } },
        { rawMaterial: { materialName: { contains: search } } },
        { rawMaterial: { materialCode: { contains: search } } }
      ]
    }

    // Supplier filter
    if (supplierId) {
      where.supplierId = supplierId
    }

    // Status filter
    if (status) {
      where.status = status
    }

    // Fetch purchases with pagination
    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: 'desc' },
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
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMode: true
            },
            orderBy: { paymentDate: 'desc' }
          }
        }
      }),
      prisma.purchase.count({ where })
    ])

    // Convert Decimal fields to numbers
    const purchasesData = purchases.map((purchase: any) => ({
      ...purchase,
      quantity: Number(purchase.quantity),
      totalAmount: Number(purchase.totalAmount),
      amountPaid: Number(purchase.amountPaid),
      balance: Number(purchase.balance),
      payments: purchase.payments.map((payment: any) => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    }))

    return NextResponse.json({
      success: true,
      data: purchasesData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching purchases:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/purchases
 * Create a new purchase transaction
 */
export async function POST(request: NextRequest) {
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
    if (!hasPermission(payload.role as any, Resource.PURCHASES, Action.CREATE)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { supplierId, rawMaterialId, quantity, totalAmount, amountPaid, purchaseDate, paymentMode, notes } = body

    // Validation
    if (!supplierId || !rawMaterialId || !quantity || !totalAmount || !purchaseDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert to numbers
    const qtyNum = parseFloat(quantity)
    const totalNum = parseFloat(totalAmount)
    const paidNum = parseFloat(amountPaid || 0)

    // Validate numbers
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(totalNum) || totalNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Total amount must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(paidNum) || paidNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Amount paid cannot be negative' },
        { status: 400 }
      )
    }

    if (paidNum > totalNum) {
      return NextResponse.json(
        { success: false, error: 'Amount paid cannot exceed total amount' },
        { status: 400 }
      )
    }

    // Calculate balance
    const balanceNum = totalNum - paidNum

    // Determine status
    let status = 'pending'

    if (paidNum === 0) {
      status = 'pending'
    } else if (paidNum > 0 && paidNum < totalNum) {
      status = 'partial'
    } else if (paidNum === totalNum) {
      status = 'paid'
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Verify raw material exists
    const rawMaterial = await prisma.rawMaterial.findUnique({
      where: { id: rawMaterialId }
    })

    if (!rawMaterial) {
      return NextResponse.json(
        { success: false, error: 'Raw material not found' },
        { status: 404 }
      )
    }

    // Create purchase with optional initial payment and update inventory
    const purchase = await prisma.$transaction(async (tx: any) => {
      const newPurchase = await tx.purchase.create({
        data: {
          supplierId,
          rawMaterialId,
          quantity: qtyNum,
          totalAmount: totalNum,
          amountPaid: paidNum,
          balance: balanceNum,
          purchaseDate: new Date(purchaseDate),
          status
        },
        include: {
          supplier: true,
          rawMaterial: true
        }
      })

      // If initial payment was made, record it
      if (paidNum > 0 && paymentMode) {
        await tx.purchasePayment.create({
          data: {
            purchaseId: newPurchase.id,
            amount: paidNum,
            paymentDate: new Date(purchaseDate),
            paymentMode,
            notes: notes || 'Initial payment'
          }
        })
      }

      // Update raw material inventory
      const inventory = await tx.rawMaterialInventory.findUnique({
        where: { rawMaterialId }
      })

      if (inventory) {
        const currentQty = Number(inventory.quantity)
        const newQty = currentQty + qtyNum

        // Update inventory
        await tx.rawMaterialInventory.update({
          where: { rawMaterialId },
          data: {
            quantity: newQty,
            lastRestockedAt: new Date()
          }
        })

        // Create inventory transaction record
        await tx.inventoryTransaction.create({
          data: {
            type: 'raw_material',
            rawMaterialInventoryId: inventory.id,
            transactionType: 'purchase',
            quantityChange: qtyNum,
            quantityBefore: currentQty,
            quantityAfter: newQty,
            referenceId: newPurchase.id,
            referenceType: 'purchase',
            notes: `Stock added from purchase from ${supplier.name}`,
            createdBy: payload.userId
          }
        })
      }

      return newPurchase
    })

    // Convert Decimal fields to numbers
    const purchaseData = {
      ...purchase,
      quantity: Number(purchase.quantity),
      totalAmount: Number(purchase.totalAmount),
      amountPaid: Number(purchase.amountPaid),
      balance: Number(purchase.balance)
    }

    return NextResponse.json({
      success: true,
      data: purchaseData,
      message: 'Purchase created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to create purchase' },
      { status: 500 }
    )
  }
}
