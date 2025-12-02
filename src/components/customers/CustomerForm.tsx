'use client'

/**
 * Customer Form Component
 * Reusable form for creating and editing customers
 */

import { useRouter } from 'next/navigation'

import { useForm, Controller } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import type { Customer } from '@prisma/client'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'

import { createCustomerSchema, updateCustomerSchema, type CreateCustomerInput, type UpdateCustomerInput } from '@/types/customerTypes'

type CustomerFormProps = {
  customer?: Customer
  mode: 'create' | 'edit'
}

const CustomerForm = ({ customer, mode }: CustomerFormProps) => {
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError
  } = useForm<CreateCustomerInput | UpdateCustomerInput>({
    resolver: zodResolver(mode === 'create' ? createCustomerSchema : updateCustomerSchema),
    defaultValues: customer
      ? {
          businessName: customer.businessName,
          address: customer.address,
          phone: customer.phone,
          location: customer.location
        }
      : {
          businessName: '',
          address: '',
          phone: '',
          location: ''
        }
  })

  const onSubmit = async (data: CreateCustomerInput | UpdateCustomerInput) => {
    try {
      const url = mode === 'create' ? '/api/customers' : `/api/customers/${customer?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to ${mode} customer`)
      }

      // Redirect to customers list on success
      router.push('/customers')
      router.refresh()
    } catch (error) {
      setFormError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'An error occurred'
      })
    }
  }

  const handleCancel = () => {
    router.push('/customers')
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>{mode === 'create' ? 'Add New Customer' : 'Edit Customer'}</h1>
        <p className='text-textSecondary'>
          {mode === 'create' ? 'Create a new customer record' : 'Update customer information'}
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            {/* Error Alert */}
            {errors.root && (
              <Alert severity='error' onClose={() => setFormError('root', { type: 'manual', message: '' })}>
                {errors.root.message}
              </Alert>
            )}

            {/* Customer Code (display only for edit mode) */}
            {mode === 'edit' && customer && (
              <TextField label='Customer Code' value={customer.customerCode} disabled fullWidth />
            )}

            <Grid container spacing={4}>
              {/* Business Name */}
              <Grid item xs={12}>
                <Controller
                  name='businessName'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Business Name'
                      required
                      fullWidth
                      error={!!errors.businessName}
                      helperText={errors.businessName?.message}
                    />
                  )}
                />
              </Grid>

              {/* Phone */}
              <Grid item xs={12} md={6}>
                <Controller
                  name='phone'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Phone Number'
                      required
                      fullWidth
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>

              {/* Location */}
              <Grid item xs={12} md={6}>
                <Controller
                  name='location'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Location'
                      required
                      fullWidth
                      error={!!errors.location}
                      helperText={errors.location?.message}
                    />
                  )}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <Controller
                  name='address'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Address'
                      required
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Form Actions */}
            <div className='flex gap-4 justify-end'>
              <Button variant='outlined' onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type='submit' variant='contained' disabled={isSubmitting} startIcon={isSubmitting && <CircularProgress size={20} />}>
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerForm
