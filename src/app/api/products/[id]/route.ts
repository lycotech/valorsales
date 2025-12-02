import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/jwt'
import prisma from '@/lib/db/prisma'
import { updateProductSchema } from '@/types/productTypes'
import { Resource, Action } from '@/types/commonTypes'

/**
 * Get single product by ID
 * GET /api/products/[id]
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
    const allowedRoles = ['admin', 'sales', 'procurement', 'management']

    if (!allowedRoles.includes(payload.role as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        price: product.price ? parseFloat(product.price.toString()) : null,
        salesCount: product._count.sales
      }
    })
  } catch (error) {
    console.error('Error fetching product:', error)

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
 * Update product by ID
 * PUT /api/products/[id]
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

    // Check permissions - Admin and Procurement can update products
    const allowedRoles = ['admin', 'procurement']

    if (!allowedRoles.includes(payload.role as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validationResult = updateProductSchema.safeParse(body)

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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Check for duplicate product name if name is being changed
    if (data.productName && data.productName !== existingProduct.productName) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          productName: {
            equals: data.productName,
            mode: 'insensitive'
          },
          id: { not: id }
        }
      })

      if (duplicateProduct) {
        return NextResponse.json(
          {
            success: false,
            error: 'Product name already exists',
            message: `A product with name "${data.productName}" already exists`
          },
          { status: 400 }
        )
      }
    }

    // Update product
    const updateData: any = {}

    if (data.productName !== undefined) updateData.productName = data.productName
    if (data.price !== undefined) updateData.price = data.price

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        price: product.price ? parseFloat(product.price.toString()) : null
      },
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('Error updating product:', error)

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
 * Delete product by ID
 * DELETE /api/products/[id]
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

    // Check permissions - Only Admin can delete products
    if (payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Only admins can delete products' }, { status: 403 })
    }

    const { id } = await params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Check for associated sales
    const salesCount = await prisma.sale.count({
      where: { productId: id }
    })

    if (salesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete product',
          message: `This product has ${salesCount} associated sales transactions and cannot be deleted`
        },
        { status: 400 }
      )
    }

    // Delete product
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)

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

