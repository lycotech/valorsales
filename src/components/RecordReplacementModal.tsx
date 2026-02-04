'use client'

/**
 * Record Replacement Modal Component
 * Modal for recording product replacements from a sale
 */

import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import type { Sale, Product, SaleItem } from '@prisma/client'

interface RecordReplacementModalProps {
  open: boolean
  onClose: () => void
  sale: {
    id: string
    saleCode?: string | null
    productId?: string | null
    product?: Pick<Product, 'productName'> | null
    items?: Array<{ productId: string }>
  } | null
  onSuccess?: () => void
}

const REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'defective', label: 'Defective' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' }
]

const RecordReplacementModal = ({ open, onClose, sale, onSuccess }: RecordReplacementModalProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    reason: 'damaged',
    notes: ''
  })

  // Extract products from sale
  useEffect(() => {
    if (!sale) return

    const productList: Array<{ id: string; name: string }> = []

    // Legacy single product
    if (sale.productId && sale.product) {
      productList.push({
        id: sale.productId,
        name: sale.product.productName
      })
    }

    // Multi-product items
    if (sale.items && sale.items.length > 0) {
      // We need to fetch product details for items
      // For now, we'll just use the productId
      sale.items.forEach(item => {
        if (!productList.find(p => p.id === item.productId)) {
          productList.push({
            id: item.productId,
            name: `Product ${item.productId.substring(0, 8)}...`
          })
        }
      })
    }

    setProducts(productList)

    // Auto-select first product if only one
    if (productList.length === 1) {
      setFormData(prev => ({ ...prev, productId: productList[0].id }))
    }
  }, [sale])

  const handleSubmit = async () => {
    if (!sale) return

    // Validation
    if (!formData.productId) {
      setError('Please select a product')
      return
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/inventory/replacements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: sale.id,
          productId: formData.productId,
          quantity: parseFloat(formData.quantity),
          reason: formData.reason,
          notes: formData.notes.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to record replacement')
      }

      // Success
      setFormData({
        productId: '',
        quantity: '',
        reason: 'damaged',
        notes: ''
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        productId: '',
        quantity: '',
        reason: 'damaged',
        notes: ''
      })
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Record Product Replacement</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' className='mb-4'>
            {error}
          </Alert>
        )}

        {sale && (
          <div className='mb-4 p-3 bg-gray-50 rounded'>
            <p className='text-sm text-gray-600'>
              <strong>Sale:</strong> {sale.saleCode || sale.id}
            </p>
          </div>
        )}

        <div className='flex flex-col gap-4 mt-4'>
          <TextField
            select
            label='Product'
            value={formData.productId}
            onChange={e => setFormData({ ...formData, productId: e.target.value })}
            fullWidth
            required
            disabled={products.length === 0}
          >
            {products.length === 0 && <MenuItem value=''>No products available</MenuItem>}
            {products.map(product => (
              <MenuItem key={product.id} value={product.id}>
                {product.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label='Quantity'
            type='number'
            value={formData.quantity}
            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
            fullWidth
            required
            inputProps={{ min: 0, step: 0.01 }}
          />

          <TextField
            select
            label='Reason'
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
            fullWidth
            required
          >
            {REASONS.map(reason => (
              <MenuItem key={reason.value} value={reason.value}>
                {reason.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label='Notes'
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder='Additional details about the replacement...'
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading || products.length === 0}>
          {loading ? 'Recording...' : 'Record Replacement'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RecordReplacementModal
