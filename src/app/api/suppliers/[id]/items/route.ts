/**
 * Supplier Item API Routes - POST (create), PUT (update), DELETE
 * Handles supplier item management
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'
import { createSupplierItemSchema } from '@/types/supplierTypes'

/**
 * POST /api/suppliers/[id]/items
 * Add a new item to a supplier
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: supplierId } = await params

    // 1. Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'No token provided' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      )
    }

    // 2. Check permissions
    if (!hasPermission(payload.role as any, Resource.SUPPLIERS, Action.CREATE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Supplier not found'
        },
        { status: 404 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validation = createSupplierItemSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: validation.error.issues[0].message,
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // 5. Generate item code (ITEM-XXXX format)
    const lastItem = await prisma.supplierItem.findFirst({
      orderBy: { itemCode: 'desc' },
      select: { itemCode: true }
    })

    let nextNumber = 1

    if (lastItem) {
      const lastNumber = parseInt(lastItem.itemCode.split('-')[1])

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }

    const itemCode = `ITEM-${nextNumber.toString().padStart(4, '0')}`

    // 6. Create item
    const item = await prisma.supplierItem.create({
      data: {
        itemCode,
        itemName: data.itemName,
        supplierId
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: item,
        message: 'Item added successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating supplier item:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to create item' },
      { status: 500 }
    )
  }
}
