'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
  Divider
} from '@mui/material'

import { createRawMaterialSchema, updateRawMaterialSchema } from '@/types/rawMaterialTypes'
import type { CreateRawMaterialInput } from '@/types/rawMaterialTypes'

interface RawMaterialFormProps {
  mode: 'create' | 'edit'
  rawMaterial?: {
    id: string
    materialCode: string
    materialName: string
  }
}

export default function RawMaterialForm({ mode, rawMaterial }: RawMaterialFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateRawMaterialInput>({
    resolver: zodResolver(mode === 'create' ? createRawMaterialSchema : updateRawMaterialSchema) as any,
    defaultValues: {
      materialName: rawMaterial?.materialName || '',
      initialStock: 0,
      minimumStock: 50,
      maximumStock: 5000,
      reorderPoint: 100
    }
  })

  const onSubmit = async (data: CreateRawMaterialInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const url = mode === 'create' ? '/api/raw-materials' : `/api/raw-materials/${rawMaterial?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        router.push('/raw-materials')
        router.refresh()
      } else {
        setError(result.message || result.error || 'Failed to save raw material')
      }
    } catch (err) {
      setError('An error occurred while saving the raw material')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h4' sx={{ mb: 4 }}>
          {mode === 'create' ? 'Create New Raw Material' : 'Edit Raw Material'}
        </Typography>

        {mode === 'edit' && rawMaterial && (
          <Alert severity='info' sx={{ mb: 4 }}>
            Material Code: <strong>{rawMaterial.materialCode}</strong> (cannot be changed)
          </Alert>
        )}

        {error && (
          <Alert severity='error' sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Controller
                name='materialName'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Material Name'
                    error={!!errors.materialName}
                    helperText={errors.materialName?.message}
                    required={mode === 'create'}
                  />
                )}
              />
            </Grid>

            {mode === 'create' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Inventory Settings
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    name='initialStock'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label='Initial Stock'
                        type='number'
                        inputProps={{ min: 0 }}
                        onChange={e => field.onChange(Number(e.target.value))}
                        error={!!errors.initialStock}
                        helperText={errors.initialStock?.message || 'Starting inventory quantity (kg)'}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    name='minimumStock'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label='Minimum Stock'
                        type='number'
                        inputProps={{ min: 0 }}
                        onChange={e => field.onChange(Number(e.target.value))}
                        error={!!errors.minimumStock}
                        helperText={errors.minimumStock?.message || 'Alert when stock falls below'}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    name='maximumStock'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label='Maximum Stock'
                        type='number'
                        inputProps={{ min: 0 }}
                        onChange={e => field.onChange(Number(e.target.value))}
                        error={!!errors.maximumStock}
                        helperText={errors.maximumStock?.message || 'Maximum storage capacity'}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    name='reorderPoint'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label='Reorder Point'
                        type='number'
                        inputProps={{ min: 0 }}
                        onChange={e => field.onChange(Number(e.target.value))}
                        error={!!errors.reorderPoint}
                        helperText={errors.reorderPoint?.message || 'When to reorder stock'}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 6 }}>
            <Button type='submit' variant='contained' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Raw Material' : 'Update Raw Material'}
            </Button>
            <Button variant='outlined' onClick={() => router.push('/raw-materials')} disabled={isSubmitting}>
              Cancel
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  )
}
