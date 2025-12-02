'use client'

/**
 * User Form Component
 * Create and edit user form with validation
 */

import { useEffect } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material'

import { createUserSchema, updateUserSchema } from '@/types/userTypes'
import { UserRole } from '@/types'

import type { User, CreateUserInput, UpdateUserInput } from '@/types/userTypes'

interface UserFormProps {
  user?: User
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  error?: string | null
}

export default function UserForm({ user, onSubmit, onCancel, isLoading, error }: UserFormProps) {
  const isEditMode = !!user

  const schema = isEditMode ? updateUserSchema : createUserSchema

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          password: undefined
        }
      : {
          email: '',
          name: '',
          role: UserRole.SALES,
          isActive: true,
          password: ''
        }
  })

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        password: undefined
      })
    }
  }, [user, reset])

  const handleFormSubmit = async (data: z.infer<typeof schema>) => {
    await onSubmit(data as CreateUserInput | UpdateUserInput)
  }

  return (
    <Card>
      <CardHeader title={isEditMode ? 'Edit User' : 'Create New User'} />
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={4}>
            {error && (
              <Grid item xs={12}>
                <Alert severity='error'>{error}</Alert>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Full Name'
                    placeholder='John Doe'
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name='email'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Email'
                    type='email'
                    placeholder='john@example.com'
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name='password'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
                    type='password'
                    placeholder='Enter password'
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name='role'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.role}>
                    <InputLabel>Role</InputLabel>
                    <Select {...field} label='Role'>
                      <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                      <MenuItem value={UserRole.SALES}>Sales Officer</MenuItem>
                      <MenuItem value={UserRole.PROCUREMENT}>Procurement Officer</MenuItem>
                      <MenuItem value={UserRole.MANAGEMENT}>Management</MenuItem>
                    </Select>
                    {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>

            {isEditMode && (
              <Grid item xs={12}>
                <Controller
                  name='isActive'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label='Active User'
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant='outlined' onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type='submit' variant='contained' disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}
