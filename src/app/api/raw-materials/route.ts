import { NextRequest, NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/client'
import { createRawMaterialSchema } from '@/types/rawMaterialTypes'
import { Resource, Action } from '@/types/commonTypes'

/**
 * Get all raw materials with search and pagination
 * GET /api/raw-materials?search=keyword&page=1&pageSize=10
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await verifyToken(request)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - Admin, Procurement can view raw materials
    const allowedRoles = ['admin', 'procurement']

    if (!allowedRoles.includes(payload.role as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { materialName: { contains: search, mode: 'insensitive' as const } },
            { materialCode: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {}

    // Get total count
    const totalCount = await prisma.rawMaterial.count({ where })

    // Get raw materials with pagination
    const rawMaterials = await prisma.rawMaterial.findMany({
      where,
      include: {
        _count: {
          select: {
            purchases: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // Transform to include purchaseCount
    const rawMaterialsWithStats = rawMaterials.map(material => ({
      ...material,
      purchaseCount: material._count.purchases
    }))

    return NextResponse.json({
      success: true,
      data: rawMaterialsWithStats,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching raw materials:', error)

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
 * Create new raw material with auto-generated material code
 * POST /api/raw-materials
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await verifyToken(request)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - Admin and Procurement can create raw materials
    const allowedRoles = ['admin', 'procurement']

    if (!allowedRoles.includes(payload.role as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = createRawMaterialSchema.safeParse(body)

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

    // Check for duplicate material name
    const existingMaterial = await prisma.rawMaterial.findFirst({
      where: {
        materialName: {
          equals: data.materialName,
          mode: 'insensitive'
        }
      }
    })

    if (existingMaterial) {
      return NextResponse.json(
        {
          success: false,
          error: 'Raw material name already exists',
          message: `A raw material with name "${data.materialName}" already exists`
        },
        { status: 400 }
      )
    }

    // Generate material code (RAW-XXXX)
    const lastMaterial = await prisma.rawMaterial.findFirst({
      orderBy: { materialCode: 'desc' },
      select: { materialCode: true }
    })

    let nextNumber = 1

    if (lastMaterial) {
      const match = lastMaterial.materialCode.match(/RAW-(\d+)/)

      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    const materialCode = `RAW-${nextNumber.toString().padStart(4, '0')}`

    // Create raw material
    const rawMaterial = await prisma.rawMaterial.create({
      data: {
        materialCode,
        materialName: data.materialName
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: rawMaterial,
        message: 'Raw material created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating raw material:', error)

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

