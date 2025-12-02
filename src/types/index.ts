/**
 * Central Type Definitions Export File
 * Re-exports all type definitions for easy importing
 */

// User & Auth types
export * from './userTypes'

// Master Data types
export * from './customerTypes'
export * from './supplierTypes'
export * from './productTypes'
export * from './rawMaterialTypes'

// Transaction types
export * from './salesTypes'
export * from './purchaseTypes'

// Report types
export * from './reportTypes'

// Common types
export * from './commonTypes'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  success: false
  error: string
  message: string
  statusCode?: number
}
