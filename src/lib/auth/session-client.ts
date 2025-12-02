/**
 * Session Management Hook
 * Client-side hook to access current user session
 */

'use client'

import { useEffect, useState } from 'react'

import type { UserWithoutPassword } from '@/types'

interface SessionState {
  user: UserWithoutPassword | null
  loading: boolean
  error: string | null
}

/**
 * Hook to access current user session
 * Fetches session from API on mount and provides user info
 *
 * @returns Session state with user, loading, and error
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { user, loading, error } = useSession()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error}</div>
 *   if (!user) return <div>Not logged in</div>
 *
 *   return <div>Welcome {user.name}</div>
 * }
 * ```
 */
export function useSession() {
  const [state, setState] = useState<SessionState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (response.ok && data.success) {
          setState({
            user: data.data,
            loading: false,
            error: null
          })
        } else {
          setState({
            user: null,
            loading: false,
            error: data.error || 'Failed to fetch session'
          })
        }
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    fetchSession()
  }, [])

  return state
}
