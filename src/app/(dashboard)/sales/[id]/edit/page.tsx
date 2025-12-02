'use client'

/**
 * Edit Sale Page
 * Update sale transaction details
 */

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { Typography, Box, Alert, CircularProgress } from '@mui/material'

import SaleForm from '@/components/forms/SaleForm'

import type { UpdateSaleInput, Sale } from '@/types/salesTypes'
import type { Customer } from '@/types/customerTypes'
import type { Product } from '@/types/productTypes'

interface SaleWithRelations extends Sale {
  customer: Customer
  product: Product
}

export default function EditSalePage() {
  const router = useRouter()
  const params = useParams()
  const saleId = params?.id as string

  const [sale, setSale] = useState<SaleWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch sale data
  useEffect(() => {
    const fetchSale = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/sales/${saleId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch sale')
        }

        if (result.success) {
          setSale(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch sale')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching sale:', err)
      } finally {
        setLoading(false)
      }
    }

    if (saleId) {
      fetchSale()
    }
  }, [saleId])

  const handleSubmit = async (data: UpdateSaleInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          supplyDate: data.supplyDate instanceof Date ? data.supplyDate.toISOString() : data.supplyDate,
          paymentDate:
            data.paymentDate instanceof Date
              ? data.paymentDate.toISOString()
              : data.paymentDate || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to update sale')
      }

      if (result.success) {
        // Redirect to sale detail page
        router.push(`/sales/${saleId}`)
      } else {
        throw new Error(result.error || 'Failed to update sale')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error updating sale:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/sales/${saleId}`)
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !sale) {
    return (
      <Box>
        <Alert severity='error'>{error || 'Sale not found'}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant='h4' gutterBottom>
          Edit Sales Transaction
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Update sale details, quantity, pricing, and payment information
        </Typography>
      </Box>

      {error && (
        <Box mb={3}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      <SaleForm sale={sale} onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isSubmitting} error={error} />
    </Box>
  )
}
