'use client'

/**
 * Create User Page
 * Page for creating a new user
 */

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Alert } from '@mui/material'

import UserForm from '@/views/admin/users/UserForm'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { Resource, Action } from '@/lib/auth/permissions'

import type { CreateUserInput, UpdateUserInput } from '@/types/userTypes'

export default function CreateUserPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        router.push('/admin/users')
      } else {
        setError(result.error || 'Failed to create user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/users')
  }

  return (
    <PermissionGate
      resource={Resource.USERS}
      action={Action.CREATE}
      fallback={
        <Alert severity='error'>
          You don&apos;t have permission to create users. Only administrators can manage users.
        </Alert>
      }
    >
      <UserForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} error={error} />
    </PermissionGate>
  )
}
