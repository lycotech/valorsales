import { NextResponse } from 'next/server'

import { getAuthToken, setAuthCookie } from '@/lib/auth/session'
import { refreshToken } from '@/lib/auth/jwt'

/**
 * Refresh authentication token endpoint
 * POST /api/auth/refresh
 * Generates a new token with extended expiry
 */
export async function POST() {
  try {
    // Get current token
    const currentToken = await getAuthToken()

    if (!currentToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          message: 'No active session found'
        },
        { status: 401 }
      )
    }

    // Generate new token
    const newToken = refreshToken(currentToken)

    if (!newToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token',
          message: 'Unable to refresh token'
        },
        { status: 401 }
      )
    }

    // Set new token in cookie
    await setAuthCookie(newToken)

    return NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        data: { token: newToken }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Token refresh error:', error)

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
