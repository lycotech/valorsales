/**
 * User Management API - Individual User Operations
 * Admin-only endpoints for get, update, delete user
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db/client'
import { hashPassword } from '@/lib/auth/password'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { updateUserSchema } from '@/types/userTypes'

/**
 * GET /api/users/[id] - Get a single user
 * Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!hasPermission(user.role, Resource.USERS, Action.READ)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = params

    const foundUser = await prisma.user.findUnique({
        where: { id },
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

      if (!foundUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'User not found'
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: foundUser
      })
  } catch (error) {
    console.error('Error fetching user:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/[id] - Update a user
 * Admin only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!hasPermission(user.role, Resource.USERS, Action.UPDATE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Validate input
    const validationResult = updateUserSchema.safeParse(body)

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

    const { email, password, name, role, isActive } = validationResult.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'User not found'
          },
          { status: 404 }
        )
      }

      // If email is being changed, check for conflicts
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email }
        })

        if (emailExists) {
          return NextResponse.json(
            {
              success: false,
              error: 'Email already in use',
              message: 'Another user with this email already exists'
            },
            { status: 409 }
          )
        }
      }

      // Prepare update data
      const updateData: any = {}

      if (email) updateData.email = email
      if (name) updateData.name = name
      if (role) updateData.role = role
      if (typeof isActive === 'boolean') updateData.isActive = isActive

      // Hash new password if provided
      if (password) {
        updateData.password = await hashPassword(password)
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
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

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      })
  } catch (error) {
    console.error('Error updating user:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id] - Delete a user
 * Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!hasPermission(user.role, Resource.USERS, Action.DELETE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      )
    }

    // Prevent deleting yourself
    if (id === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete yourself',
          message: 'You cannot delete your own account'
        },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
