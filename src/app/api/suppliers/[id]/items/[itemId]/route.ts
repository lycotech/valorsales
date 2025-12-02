/**
 * Supplier Item API Routes - PUT (update), DELETE (delete individual item)
 * Handles individual supplier item operations
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'
import { updateSupplierItemSchema } from '@/types/supplierTypes'

/**
 * PUT /api/suppliers/[id]/items/[itemId]
 * Update a supplier item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params

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
    if (!hasPermission(payload.role as any, Resource.SUPPLIERS, Action.UPDATE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Check if item exists
    const existingItem = await prisma.supplierItem.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Item not found'
        },
        { status: 404 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validation = updateSupplierItemSchema.safeParse(body)

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

    // 5. Update item (itemCode cannot be changed)
    const item = await prisma.supplierItem.update({
      where: { id: itemId },
      data: {
        ...(data.itemName && { itemName: data.itemName })
      }
    })

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Item updated successfully'
    })
  } catch (error) {
    console.error('Error updating supplier item:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to update item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suppliers/[id]/items/[itemId]
 * Delete a supplier item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params

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
    if (!hasPermission(payload.role as any, Resource.SUPPLIERS, Action.DELETE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Check if item exists
    const existingItem = await prisma.supplierItem.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Item not found'
        },
        { status: 404 }
      )
    }

    // 4. Delete item
    await prisma.supplierItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting supplier item:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
