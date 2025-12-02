/**
 * Password Hashing and Verification Utilities
 * Uses bcrypt for secure password hashing
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  return hashedPassword
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const isValid = await bcrypt.compare(password, hashedPassword)

  return isValid
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  message: string
} {
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters long'
    }
  }

  if (password.length > 100) {
    return {
      isValid: false,
      message: 'Password is too long (max 100 characters)'
    }
  }

  // Optional: Add more complex validation rules
  // const hasUpperCase = /[A-Z]/.test(password)
  // const hasLowerCase = /[a-z]/.test(password)
  // const hasNumbers = /\d/.test(password)
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return {
    isValid: true,
    message: 'Password is valid'
  }
}
