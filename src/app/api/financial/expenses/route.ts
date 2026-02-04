/**
 * Expense API Routes - GET (list) and POST (create)
 * Handles expense listing and creation
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import prisma from '@/lib/db/client'
import { logCreate, getRequestDetails } from '@/lib/auditLogger'

/**
 * GET /api/financial/expenses
 * List all expenses with optional filtering and pagination
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

    // 3. Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const skip = (page - 1) * pageSize

    // 4. Build where clause for filtering
    const where: any = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // 5. Fetch expenses and total count
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: true
        },
        orderBy: { date: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.expense.count({ where })
    ])

    // 6. Return response with amount formatted
    return NextResponse.json({
      success: true,
      data: expenses.map(e => ({
        ...e,
        amount: parseFloat(e.amount.toString())
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to fetch expenses'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/financial/expenses
 * Create a new expense
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

    // 2. Check permissions (Admin and Management can create expenses)
    if (!hasPermission(payload.role as any, Resource.USERS, Action.MANAGE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const { amount, date, categoryId, description, paymentMethod, reference } = body

    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Valid amount is required'
        },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Date is required'
        },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Category is required'
        },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Payment method is required'
        },
        { status: 400 }
      )
    }

    // 4. Verify category exists
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Invalid category'
        },
        { status: 400 }
      )
    }

    // 5. Create expense
    const expense = await prisma.expense.create({
      data: {
        amount,
        date: new Date(date),
        categoryId,
        description: description?.trim() || null,
        paymentMethod,
        reference: reference?.trim() || null,
        createdBy: payload.userId
      },
      include: {
        category: true
      }
    })

    // 6. Audit log
    const reqDetails = getRequestDetails(request)

    logCreate(
      'expense',
      expense.id,
      { amount, categoryName: category.name, date },
      payload.userId,
      reqDetails
    )

    // 7. Return response
    return NextResponse.json(
      {
        success: true,
        message: 'Expense created successfully',
        data: {
          ...expense,
          amount: parseFloat(expense.amount.toString())
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating expense:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to create expense'
      },
      { status: 500 }
    )
  }
}
