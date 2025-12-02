'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  IconButton,
  Divider,
  Paper
} from '@mui/material'

import type { CreateSupplierInput, UpdateSupplierInput, SupplierWithItems } from '@/types/supplierTypes'
import { createSupplierSchema, updateSupplierSchema } from '@/types/supplierTypes'

interface SupplierFormProps {
  mode: 'create' | 'edit'
  supplier?: SupplierWithItems
}

export default function SupplierForm({ mode, supplier }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = mode === 'edit'

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateSupplierInput>({
    resolver: zodResolver(isEditMode ? updateSupplierSchema : createSupplierSchema) as any,
    defaultValues: isEditMode && supplier
      ? {
          name: supplier.name,
          address: supplier.address,
          phone: supplier.phone,
          location: supplier.location,
          items: []
        }
      : {
          name: '',
          address: '',
          phone: '',
          location: '',
          items: []
        }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items' as any
  })

  const onSubmit = async (data: CreateSupplierInput | UpdateSupplierInput) => {
    setLoading(true)
    setError(null)

    try {
      const url = isEditMode ? `/api/suppliers/${supplier?.id}` : '/api/suppliers'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to ${isEditMode ? 'update' : 'create'} supplier`)
      }

      router.push('/suppliers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h4' sx={{ mb: 4 }}>
          {isEditMode ? 'Edit Supplier' : 'Add New Supplier'}
        </Typography>

        {error && (
          <Alert severity='error' sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {isEditMode && supplier && (
          <Alert severity='info' sx={{ mb: 4 }}>
            <strong>Supplier Code:</strong> {supplier.supplierCode} (cannot be changed)
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={4}>
            {/* Supplier Information Section */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Supplier Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Supplier Name'
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    required={!isEditMode}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name='phone'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Phone Number'
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    required={!isEditMode}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name='location'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Location'
                    error={!!errors.location}
                    helperText={errors.location?.message}
                    required={!isEditMode}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name='address'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Address'
                    multiline
                    rows={3}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                    required={!isEditMode}
                  />
                )}
              />
            </Grid>

            {/* Items Section (Only for Create Mode) */}
            {!isEditMode && (
              <>
                <Grid item xs={12}>
                  <Typography variant='h6' sx={{ mb: 2, mt: 2 }}>
                    Supplier Items (Optional)
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant='outlined'
                      startIcon={<i className='ri-add-line' />}
                      onClick={() => append({ itemName: '' } as any)}
                    >
                      Add Item
                    </Button>
                  </Box>

                  {fields.map((field, index) => (
                    <Paper key={field.id} sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Controller
                          name={`items.${index}.itemName` as any}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label={`Item ${index + 1} Name`}
                              error={!!(errors.items as any)?.[index]?.itemName}
                              helperText={(errors.items as any)?.[index]?.itemName?.message}
                              required
                            />
                          )}
                        />
                        <IconButton color='error' onClick={() => remove(index)} sx={{ mt: 1 }}>
                          <i className='ri-delete-bin-line' />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}

                  {fields.length === 0 && (
                    <Alert severity='info'>No items added yet. Click &quot;Add Item&quot; to add supplier items.</Alert>
                  )}
                </Grid>
              </>
            )}

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button type='submit' variant='contained' color='primary' disabled={loading}>
                  {loading ? 'Saving...' : isEditMode ? 'Update Supplier' : 'Create Supplier'}
                </Button>
                <Button variant='outlined' color='secondary' onClick={() => router.push('/suppliers')} disabled={loading}>
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}
