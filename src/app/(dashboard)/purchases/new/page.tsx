'use client'

/**
 * New Purchase Entry Page
 * Create new raw material purchase transactions
 */

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Box, Typography, Button, Alert } from '@mui/material'

import PurchaseForm from '@/components/forms/PurchaseForm'

interface PurchaseFormData {
  supplierId: string
  rawMaterialId: string
  quantity: number
  totalAmount: number
  amountPaid: number
  purchaseDate: Date
  paymentMode: string
  notes: string
}

export default function NewPurchasePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: PurchaseFormData) => {
    try {
      setError(null)

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supplierId: data.supplierId,
          rawMaterialId: data.rawMaterialId,
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          amountPaid: data.amountPaid,
          purchaseDate: data.purchaseDate.toISOString(),
          paymentMode: data.paymentMode,
          notes: data.notes
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create purchase')
      }

      if (result.success) {
        router.push('/purchases')
      } else {
        throw new Error(result.error || 'Failed to create purchase')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const handleCancel = () => {
    router.push('/purchases')
  }

  return (
    <Box>
      <Box mb={4} display='flex' justifyContent='space-between' alignItems='center'>
        <Box>
          <Typography variant='h4' gutterBottom>
            New Purchase
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Record a new raw material purchase transaction
          </Typography>
        </Box>
        <Button variant='outlined' onClick={handleCancel}>
          Back to Purchases
        </Button>
      </Box>

      {error && (
        <Box mb={3}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      <PurchaseForm onSubmit={handleSubmit} onCancel={handleCancel} submitLabel='Create Purchase' />
    </Box>
  )
}
