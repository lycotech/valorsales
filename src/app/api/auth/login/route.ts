import { NextRequest, NextResponse } from 'next/server'

import { loginSchema } from '@/types'
import { prisma } from '@/lib/db/client'
import { verifyPassword } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'
import { setAuthCookie } from '@/lib/auth/session'

/**
 * User Login
 * POST /api/auth/login
 * @body { email: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 1. Validate credentials with Zod
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: validation.error.errors[0].message
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // 2. Check user exists in database
    const user = await prisma.user.findUnique(
      { where: { email: email.toLowerCase() } }
    )

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        },
        { status: 401 }
      )
    }

    // 3. Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact administrator.'
        },
        { status: 403 }
      )
    }

    // 4. Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        },
        { status: 401 }
      )
    }

    // 5. Generate JWT token
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    const token = generateToken(userWithoutPassword)

    // 6. Set authentication cookie
    await setAuthCookie(token)

    // 7. Return user data and token
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
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

