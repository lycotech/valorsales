/**
 * Supplier API Routes - GET (single), PUT (update), DELETE
 * Handles individual supplier operations
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'
import { updateSupplierSchema } from '@/types/supplierTypes'

/**
 * GET /api/suppliers/[id]
 * Get a single supplier by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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
    if (!hasPermission(payload.role as any, Resource.SUPPLIERS, Action.READ)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Fetch supplier with items
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            items: true,
            purchases: true
          }
        }
      }
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

    return NextResponse.json({
      success: true,
      data: supplier
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/suppliers/[id]
 * Update an existing supplier
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    // 2. Check permissions (Admin, Procurement Officer can update suppliers)
    if (!hasPermission(payload.role as any, Resource.SUPPLIERS, Action.UPDATE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    })

    if (!existingSupplier) {
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
    const validation = updateSupplierSchema.safeParse(body)

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

    // 5. Check if name is being changed and if it already exists
    if (data.name && data.name !== existingSupplier.name) {
      const duplicateSupplier = await prisma.supplier.findFirst({
        where: { name: data.name }
      })

      if (duplicateSupplier) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            message: 'A supplier with this name already exists'
          },
          { status: 400 }
        )
      }
    }

    // 6. Update supplier (note: supplierCode cannot be changed)
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.phone && { phone: data.phone }),
        ...(data.otherPhone !== undefined && { otherPhone: data.otherPhone || null }),
        ...(data.location && { location: data.location })
      },
      include: {
        items: true,
        _count: {
          select: {
            items: true,
            purchases: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    })
  } catch (error) {
    console.error('Error updating supplier:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suppliers/[id]
 * Delete a supplier (only if no associated purchases exist)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    // 2. Check permissions (Admin, Procurement Officer can delete suppliers)
    if (!hasPermission(payload.role as any, Resource.SUPPLIERS, Action.DELETE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    })

    if (!existingSupplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Supplier not found'
        },
        { status: 404 }
      )
    }

    // 4. Check if supplier has associated purchases
    const purchaseCount = await prisma.purchase.count({
      where: { supplierId: id }
    })

    if (purchaseCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: `Cannot delete supplier. ${purchaseCount} purchase(s) are associated with this supplier.`
        },
        { status: 400 }
      )
    }

    // 5. Delete supplier (items will be cascade deleted)
    await prisma.supplier.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}

