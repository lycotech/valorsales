/**
 * User Management API - List and Create Users
 * Admin-only endpoints for user CRUD operations
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db/client'
import { hashPassword } from '@/lib/auth/password'
import { requirePermission } from '@/lib/auth/permissionMiddleware'
import { Resource, Action } from '@/lib/auth/permissions'
import { createUserSchema } from '@/types/userTypes'

/**
 * GET /api/users - List all users
 * Admin only
 */
export const GET = requirePermission(Resource.USERS, Action.READ, async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Error fetching users:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

/**
 * POST /api/users - Create a new user
 * Admin only
 */
export const POST = requirePermission(
  Resource.USERS,
  Action.CREATE,
  async (request: NextRequest) => {
    try {
      const body = await request.json()

      // Validate input
      const validationResult = createUserSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validationResult.error.issues
          },
          { status: 400 }
        )
      }

      const { email, password, name, role } = validationResult.data

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'User already exists',
            message: 'A user with this email already exists'
          },
          { status: 409 }
        )
      }

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      })

      return NextResponse.json(
        {
          success: true,
          data: newUser,
          message: 'User created successfully'
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Error creating user:', error)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  }
)
