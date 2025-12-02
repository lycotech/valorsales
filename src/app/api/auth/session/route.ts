import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/session'

/**
 * Get current session
 * GET /api/auth/session
 * Returns the currently authenticated user
 */
export async function GET() {
  try {
    // Get current user from session
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          message: 'No active session found'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { user }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Session error:', error)
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

