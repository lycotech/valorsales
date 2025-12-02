import { NextResponse } from 'next/server'

import { clearAuthCookie } from '@/lib/auth/session'

/**
 * User Logout
 * POST /api/auth/logout
 */
export async function POST() {
  try {
    // Clear authentication cookie
    await clearAuthCookie()

    return NextResponse.json(
      {
        success: true,
        message: 'Logout successful'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
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

