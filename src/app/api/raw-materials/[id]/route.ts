import { NextRequest, NextResponse } from 'next/server'

import { verifyAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/client'
import { updateRawMaterialSchema } from '@/types/rawMaterialTypes'
import { Resource, Action } from '@/types/commonTypes'

/**
 * Get single raw material by ID
 * GET /api/raw-materials/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const payload = await verifyAuth(request)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const allowedRoles = ['admin', 'procurement', 'management']

    if (!allowedRoles.includes(payload.role as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const rawMaterial = await prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true
          }
        }
      }
    })

    if (!rawMaterial) {
      return NextResponse.json({ success: false, error: 'Raw material not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...rawMaterial,
        purchaseCount: rawMaterial._count.purchases
      }
    })
  } catch (error) {
    console.error('Error fetching raw material:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Update raw material by ID
 * PUT /api/raw-materials/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const payload = await verifyAuth(request)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - Admin and Procurement can update raw materials
    const allowedRoles = ['admin', 'procurement']

    if (!allowedRoles.includes(payload.role as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validationResult = updateRawMaterialSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if raw material exists
    const existingMaterial = await prisma.rawMaterial.findUnique({
      where: { id }
    })

    if (!existingMaterial) {
      return NextResponse.json({ success: false, error: 'Raw material not found' }, { status: 404 })
    }

    // Check for duplicate material name if name is being changed
    if (data.materialName && data.materialName !== existingMaterial.materialName) {
      const duplicateMaterial = await prisma.rawMaterial.findFirst({
        where: {
          materialName: {
            equals: data.materialName,
            mode: 'insensitive'
          },
          id: { not: id }
        }
      })

      if (duplicateMaterial) {
        return NextResponse.json(
          {
            success: false,
            error: 'Raw material name already exists',
            message: `A raw material with name "${data.materialName}" already exists`
          },
          { status: 400 }
        )
      }
    }

    // Update raw material
    const updateData: any = {}

    if (data.materialName !== undefined) updateData.materialName = data.materialName

    const rawMaterial = await prisma.rawMaterial.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: rawMaterial,
      message: 'Raw material updated successfully'
    })
  } catch (error) {
    console.error('Error updating raw material:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Delete raw material by ID
 * DELETE /api/raw-materials/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const payload = await verifyAuth(request)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - Only Admin can delete raw materials
    if (payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Only admins can delete raw materials' }, { status: 403 })
    }

    const { id } = await params

    // Check if raw material exists
    const rawMaterial = await prisma.rawMaterial.findUnique({
      where: { id }
    })

    if (!rawMaterial) {
      return NextResponse.json({ success: false, error: 'Raw material not found' }, { status: 404 })
    }

    // Check for associated purchases
    const purchaseCount = await prisma.purchase.count({
      where: { rawMaterialId: id }
    })

    if (purchaseCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete raw material',
          message: `This raw material has ${purchaseCount} associated purchase transactions and cannot be deleted`
        },
        { status: 400 }
      )
    }

    // Delete raw material
    await prisma.rawMaterial.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Raw material deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting raw material:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

