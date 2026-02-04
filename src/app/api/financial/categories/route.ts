/**
 * Expense Category API Routes - GET (list) and POST (create)
 * Handles expense category listing and creation
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'
import { logCreate, getRequestDetails } from '@/lib/auditLogger'

/**
 * GET /api/financial/categories
 * List all expense categories
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

    // 2. Check permissions (Admin and Management can read financial data)
    if (!hasPermission(payload.role as any, Resource.REPORTS, Action.READ)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Fetch all expense categories
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { expenses: true }
        }
      }
    })

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching expense categories:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to fetch expense categories'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/financial/categories
 * Create a new expense category
 */
export async function POST(request: NextRequest) {
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

    // 2. Check permissions (Admin can create expense categories)
    if (!hasPermission(payload.role as any, Resource.USERS, Action.MANAGE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Category name is required'
        },
        { status: 400 }
      )
    }

    // 4. Check if category already exists
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: { name: name.trim() }
    })

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'A category with this name already exists'
        },
        { status: 400 }
      )
    }

    // 5. Create category
    const category = await prisma.expenseCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    })

    // 6. Audit log
    const reqDetails = getRequestDetails(request)

    logCreate('expense_category', category.id, { name: category.name }, payload.userId, reqDetails)

    // 7. Return response
    return NextResponse.json(
      {
        success: true,
        message: 'Expense category created successfully',
        data: category
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating expense category:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to create expense category'
      },
      { status: 500 }
    )
  }
}
