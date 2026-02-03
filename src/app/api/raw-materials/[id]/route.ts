import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db/client'
import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { updateRawMaterialSchema } from '@/types/rawMaterialTypes'

// Helper function to verify auth from request
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (!token) return null

  return verifyToken(token)
}

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

    // Check permissions - Use RBAC system
    if (!hasPermission(payload.role as any, Resource.RAW_MATERIALS, Action.READ)) {
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

    // Check permissions - Use RBAC system
    if (!hasPermission(payload.role as any, Resource.RAW_MATERIALS, Action.UPDATE)) {
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
          details: validationResult.error.issues
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
          materialName: data.materialName,
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

    // Update raw material and inventory in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update raw material
      const updateData: any = {}

      if (data.materialName !== undefined) updateData.materialName = data.materialName

      const rawMaterial = await tx.rawMaterial.update({
        where: { id },
        data: updateData
      })

      // Update inventory if inventory settings are provided
      const inventoryUpdateData: any = {}

      if (data.minimumStock !== undefined) inventoryUpdateData.minimumStock = data.minimumStock
      if (data.maximumStock !== undefined) inventoryUpdateData.maximumStock = data.maximumStock
      if (data.reorderPoint !== undefined) inventoryUpdateData.reorderPoint = data.reorderPoint
      if (data.unit !== undefined) inventoryUpdateData.unit = data.unit

      let inventory = null

      if (Object.keys(inventoryUpdateData).length > 0) {
        // Get or create inventory
        inventory = await tx.rawMaterialInventory.findUnique({
          where: { rawMaterialId: id }
        })

        if (inventory) {
          inventory = await tx.rawMaterialInventory.update({
            where: { rawMaterialId: id },
            data: inventoryUpdateData
          })
        } else {
          // Create inventory if it doesn't exist
          inventory = await tx.rawMaterialInventory.create({
            data: {
              rawMaterialId: id,
              quantity: 0,
              minimumStock: data.minimumStock || 50,
              maximumStock: data.maximumStock || null,
              reorderPoint: data.reorderPoint || 100,
              unit: data.unit || 'kg',
              ...inventoryUpdateData
            }
          })
        }
      }

      return { rawMaterial, inventory }
    })

    return NextResponse.json({
      success: true,
      data: result.rawMaterial,
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

    // Check permissions - Use RBAC system
    if (!hasPermission(payload.role as any, Resource.RAW_MATERIALS, Action.DELETE)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
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

