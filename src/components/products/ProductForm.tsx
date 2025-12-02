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
  InputAdornment
} from '@mui/material'

import { createProductSchema, updateProductSchema } from '@/types/productTypes'
import type { CreateProductInput } from '@/types/productTypes'

interface ProductFormProps {
  mode: 'create' | 'edit'
  product?: {
    id: string
    productCode: string
    productName: string
    price: number | null
  }
}

export default function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateProductInput>({
    resolver: zodResolver(mode === 'create' ? createProductSchema : updateProductSchema) as any,
    defaultValues: {
      productName: product?.productName || '',
      price: product?.price || null
    }
  })

  const onSubmit = async (data: CreateProductInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const url = mode === 'create' ? '/api/products' : `/api/products/${product?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        router.push('/products')
        router.refresh()
      } else {
        setError(result.message || result.error || 'Failed to save product')
      }
    } catch (err) {
      setError('An error occurred while saving the product')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h4' sx={{ mb: 4 }}>
          {mode === 'create' ? 'Create New Product' : 'Edit Product'}
        </Typography>

        {mode === 'edit' && product && (
          <Alert severity='info' sx={{ mb: 4 }}>
            Product Code: <strong>{product.productCode}</strong> (cannot be changed)
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
                name='productName'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Product Name'
                    error={!!errors.productName}
                    helperText={errors.productName?.message}
                    required={mode === 'create'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name='price'
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Price (Optional)'
                    type='number'
                    value={value || ''}
                    onChange={e => {
                      const val = e.target.value

                      onChange(val === '' ? null : parseFloat(val))
                    }}
                    error={!!errors.price}
                    helperText={errors.price?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>₦</InputAdornment>
                    }}
                    inputProps={{
                      step: '0.01',
                      min: '0'
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 6 }}>
            <Button type='submit' variant='contained' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
            </Button>
            <Button variant='outlined' onClick={() => router.push('/products')} disabled={isSubmitting}>
              Cancel
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  )
}
