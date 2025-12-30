'use client'

/**
 * Sales Entry Page
 * Create new sales transactions
 */

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Typography, Box, Alert } from '@mui/material'

import SaleForm from '@/components/forms/SaleForm'

import type { CreateSaleInput } from '@/types/salesTypes'

export default function NewSalePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: CreateSaleInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          supplyDate: data.supplyDate instanceof Date ? data.supplyDate.toISOString() : data.supplyDate,
          paymentDate: data.paymentDate ? (data.paymentDate instanceof Date ? data.paymentDate.toISOString() : data.paymentDate) : undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Prefer the detailed message from the API (e.g. inventory / stock errors)
        throw new Error(result.message || result.error || 'Failed to create sale')
      }

      if (result.success) {
        // Redirect to sales list
        router.push('/sales')
      } else {
        throw new Error(result.error || 'Failed to create sale')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error creating sale:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/sales')
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant='h4' gutterBottom>
          New Sales Transaction
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Record a new sale with product details, quantity, pricing, and payment information
        </Typography>
      </Box>

      {error && (
        <Box mb={3}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      <SaleForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} error={error} />
    </Box>
  )
}
