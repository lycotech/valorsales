/**
 * JWT Token Generation and Verification
 * Handles authentication tokens for session management
 */

import jwt from 'jsonwebtoken'

import type { UserWithoutPassword } from '@/types'

// JWT Secret - In production, this should be a strong secret from environment variables
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Generate a JWT token for a user
 * @param user - User object (without password)
 * @returns JWT token string
 */
export function generateToken(user: UserWithoutPassword): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  }

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions)

  return token
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    return decoded
  } catch (error) {
    // Token is invalid or expired

    return null
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param token - JWT token string
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload

    return decoded
  } catch (error) {

    return null
  }
}

/**
 * Check if a token is expired
 * @param token - JWT token string
 * @returns True if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)

  if (!decoded || !decoded.exp) {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)

  return decoded.exp < currentTime
}

/**
 * Refresh a token (generate a new one with extended expiry)
 * @param token - Current JWT token
 * @returns New JWT token or null if current token is invalid
 */
export function refreshToken(token: string): string | null {
  const payload = verifyToken(token)

  if (!payload) {
    return null
  }

  // Generate new token with same payload
  const newToken = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    } as jwt.SignOptions
  )

  return newToken
}
