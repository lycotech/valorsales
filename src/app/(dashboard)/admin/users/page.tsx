'use client'

/**
 * User List Page
 * Main page for user management
 */

import { useEffect, useState } from 'react'

import { Alert } from '@mui/material'

import UserList from '@/views/admin/users/UserList'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { Resource, Action } from '@/lib/auth/permissions'

import type { User } from '@/types/userTypes'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/users')
      const data = await response.json()

      if (response.ok && data.success) {
        setUsers(data.data)
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh users list
        await fetchUsers()
      } else {
        setError(data.error || 'Failed to delete user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  return (
    <PermissionGate
      resource={Resource.USERS}
      action={Action.READ}
      fallback={
        <Alert severity='error'>
          You don&apos;t have permission to access this page. Only administrators can manage users.
        </Alert>
      }
    >
      <div>
        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <UserList users={users} onDelete={handleDelete} isLoading={isLoading} />
      </div>
    </PermissionGate>
  )
}
