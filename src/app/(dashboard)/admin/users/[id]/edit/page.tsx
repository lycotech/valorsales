'use client'

/**
 * Edit User Page
 * Page for editing an existing user
 */

import { useEffect, useState } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { Alert, CircularProgress, Box } from '@mui/material'

import UserForm from '@/views/admin/users/UserForm'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { Resource, Action } from '@/lib/auth/permissions'

import type { User, UpdateUserInput } from '@/types/userTypes'

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsFetching(true)
        setError(null)

        const response = await fetch(`/api/users/${userId}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setUser(data.data)
        } else {
          setError(data.error || 'Failed to fetch user')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user')
      } finally {
        setIsFetching(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId])

  const handleSubmit = async (data: UpdateUserInput) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        router.push('/admin/users')
      } else {
        setError(result.error || 'Failed to update user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/users')
  }

  if (isFetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return (
      <Alert severity='error'>
        User not found
      </Alert>
    )
  }

  return (
    <PermissionGate
      resource={Resource.USERS}
      action={Action.UPDATE}
      fallback={
        <Alert severity='error'>
          You don&apos;t have permission to edit users. Only administrators can manage users.
        </Alert>
      }
    >
      <UserForm
        user={user}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        error={error}
      />
    </PermissionGate>
  )
}
