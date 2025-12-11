/**
 * API Client - Centralized API client with error handling and loading states
 */

// Toast notification helpers (can be replaced with actual toast library)
const toast = {
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg)
}

// ============================================
// TYPES
// ============================================

export interface APIResponse<T = any> {
  data: T | null
  error: string | null
  status: number
}

export interface APIError {
  message: string
  code?: string
  field?: string
  details?: Record<string, any>
}

export interface RequestOptions extends RequestInit {
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
  timeout?: number
}

// ============================================
// API CLIENT
// ============================================

const DEFAULT_TIMEOUT = 30000 // 30 seconds

/**
 * Main API client function
 */
async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    errorMessage,
    timeout = DEFAULT_TIMEOUT,
    ...fetchOptions
  } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers
      }
    })

    clearTimeout(timeoutId)

    // Parse response
    let data: T | null = null
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      data = await response.json()
    }

    // Handle non-OK responses
    if (!response.ok) {
      const error = extractErrorMessage(data, response.status) || errorMessage || 'An error occurred'

      if (showErrorToast) {
        toast.error(error)
      }

      return {
        data: null,
        error,
        status: response.status
      }
    }

    // Success
    if (showSuccessToast && successMessage) {
      toast.success(successMessage)
    }

    return {
      data,
      error: null,
      status: response.status
    }
  } catch (error: any) {
    clearTimeout(timeoutId)

    let errorMsg = errorMessage || 'Network error occurred'

    if (error.name === 'AbortError') {
      errorMsg = 'Request timed out'
    } else if (error.message === 'Failed to fetch') {
      errorMsg = 'Unable to connect to server'
    }

    if (showErrorToast) {
      toast.error(errorMsg)
    }

    return {
      data: null,
      error: errorMsg,
      status: 0
    }
  }
}

/**
 * Extract error message from response data
 */
function extractErrorMessage(data: any, status: number): string {
  if (!data) {
    switch (status) {
      case 400:
        return 'Bad request - please check your input'
      case 401:
        return 'Please login to continue'
      case 403:
        return 'You do not have permission to perform this action'
      case 404:
        return 'Resource not found'
      case 409:
        return 'Conflict - resource already exists'
      case 422:
        return 'Validation error - please check your input'
      case 500:
        return 'Server error - please try again later'
      default:
        return 'An error occurred'
    }
  }

  if (typeof data === 'string') return data
  if (data.error) return data.error
  if (data.message) return data.message
  if (data.errors && Array.isArray(data.errors)) {
    return data.errors.map((e: any) => e.message || e).join(', ')
  }

  return 'An error occurred'
}

// ============================================
// HTTP METHOD HELPERS
// ============================================

const api = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),

  /**
   * PUT request
   */
  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }),

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
}

export default api

// ============================================
// HOOKS (React Query-like patterns)
// ============================================

import { useState, useEffect, useCallback } from 'react'

export interface UseAPIOptions<T> {
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  refetchInterval?: number
}

export interface UseAPIResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

/**
 * Custom hook for API requests with state management
 */
export function useAPI<T>(endpoint: string, options: UseAPIOptions<T> = {}): UseAPIResult<T> {
  const { enabled = true, onSuccess, onError, refetchInterval } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const response = await api.get<T>(endpoint, { showErrorToast: false })

    if (response.error) {
      setError(response.error)
      onError?.(response.error)
    } else {
      setData(response.data)
      onSuccess?.(response.data!)
    }

    setIsLoading(false)
  }, [endpoint, onSuccess, onError])

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData])

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval)

      return () => clearInterval(interval)
    }
  }, [refetchInterval, enabled, fetchData])

  return {
    data,
    error,
    isLoading,
    isError: !!error,
    refetch: fetchData
  }
}

/**
 * Custom hook for mutations (POST, PUT, DELETE)
 */
export interface UseMutationOptions<T, D> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  showSuccessToast?: boolean
  successMessage?: string
}

export interface UseMutationResult<T, D> {
  data: T | null
  error: string | null
  isLoading: boolean
  isError: boolean
  mutate: (data?: D) => Promise<APIResponse<T>>
  reset: () => void
}

export function useMutation<T, D = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: UseMutationOptions<T, D> = {}
): UseMutationResult<T, D> {
  const { onSuccess, onError, showSuccessToast, successMessage } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (mutationData?: D): Promise<APIResponse<T>> => {
      setIsLoading(true)
      setError(null)

      const requestOptions: RequestOptions = {
        showSuccessToast,
        successMessage
      }

      let response: APIResponse<T>

      switch (method) {
        case 'POST':
          response = await api.post<T>(endpoint, mutationData, requestOptions)
          break
        case 'PUT':
          response = await api.put<T>(endpoint, mutationData, requestOptions)
          break
        case 'PATCH':
          response = await api.patch<T>(endpoint, mutationData, requestOptions)
          break
        case 'DELETE':
          response = await api.delete<T>(endpoint, requestOptions)
          break
      }

      if (response.error) {
        setError(response.error)
        onError?.(response.error)
      } else {
        setData(response.data)
        onSuccess?.(response.data!)
      }

      setIsLoading(false)

      return response
    },
    [endpoint, method, onSuccess, onError, showSuccessToast, successMessage]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    data,
    error,
    isLoading,
    isError: !!error,
    mutate,
    reset
  }
}
