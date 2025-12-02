/**
 * User & Authentication Type Definitions
 */

import { z } from 'zod'

import { UserRole } from './commonTypes'
import type { BaseEntity } from './commonTypes'

// ============================================
// INTERFACES
// ============================================

export interface User extends BaseEntity {
  email: string
  password: string
  name: string
  role: UserRole
  isActive: boolean
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthSession {
  user: UserWithoutPassword
  token: string
  expiresAt: Date
}

export interface CreateUserInput {
  email: string
  password: string
  name: string
  role: UserRole
  isActive?: boolean
}

export interface UpdateUserInput {
  email?: string
  name?: string
  role?: UserRole
  isActive?: boolean
  password?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const userRoleSchema = z.enum(['admin', 'sales', 'procurement', 'management'])

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
})

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  role: userRoleSchema,
  isActive: z.boolean().optional().default(true)
})

export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .optional(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long')
    .optional()
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password too long'),
    confirmPassword: z.string().min(1, 'Confirm password is required')
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword']
  })

// ============================================
// TYPE GUARDS
// ============================================

export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole)
}

export const hasAdminRole = (user: UserWithoutPassword): boolean => {
  return user.role === UserRole.ADMIN
}

export const hasSalesRole = (user: UserWithoutPassword): boolean => {
  return user.role === UserRole.SALES || user.role === UserRole.ADMIN
}

export const hasProcurementRole = (user: UserWithoutPassword): boolean => {
  return user.role === UserRole.PROCUREMENT || user.role === UserRole.ADMIN
}

export const hasManagementRole = (user: UserWithoutPassword): boolean => {
  return user.role === UserRole.MANAGEMENT || user.role === UserRole.ADMIN
}
