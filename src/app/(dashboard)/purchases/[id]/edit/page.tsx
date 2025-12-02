'use client'

/**
 * Edit Purchase Page
 * Edit existing purchase transaction
 */

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material'

import PurchaseForm from '@/components/forms/PurchaseForm'

interface Purchase {
  id: string
  supplierId: string
  rawMaterialId: string
  quantity: number
  totalAmount: number
  amountPaid: number
  balance: number
  purchaseDate: string
  status: string
}

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

export default function EditPurchasePage() {
  const router = useRouter()
  const params = useParams()
  const purchaseId = params?.id as string

  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch purchase data
  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await fetch(`/api/purchases/${purchaseId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch purchase')
        }

        if (result.success) {
          setPurchase(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch purchase')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (purchaseId) {
      fetchPurchase()
    }
  }, [purchaseId])

  const handleSubmit = async (data: PurchaseFormData) => {
    try {
      setError(null)

      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supplierId: data.supplierId,
          rawMaterialId: data.rawMaterialId,
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          purchaseDate: data.purchaseDate.toISOString()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update purchase')
      }

      if (result.success) {
        router.push(`/purchases/${purchaseId}`)
      } else {
        throw new Error(result.error || 'Failed to update purchase')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const handleCancel = () => {
    router.push(`/purchases/${purchaseId}`)
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  if (!purchase) {
    return (
      <Box>
        <Alert severity='error'>Purchase not found</Alert>
        <Button variant='outlined' onClick={() => router.push('/purchases')} sx={{ mt: 2 }}>
          Back to Purchases
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={4} display='flex' justifyContent='space-between' alignItems='center'>
        <Box>
          <Typography variant='h4' gutterBottom>
            Edit Purchase
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Update purchase transaction details
          </Typography>
        </Box>
        <Button variant='outlined' onClick={handleCancel}>
          Back to Details
        </Button>
      </Box>

      {error && (
        <Box mb={3}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      <PurchaseForm
        initialData={{
          supplierId: purchase.supplierId,
          rawMaterialId: purchase.rawMaterialId,
          quantity: purchase.quantity,
          totalAmount: purchase.totalAmount,
          amountPaid: purchase.amountPaid,
          purchaseDate: new Date(purchase.purchaseDate)
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel='Update Purchase'
      />
    </Box>
  )
}
