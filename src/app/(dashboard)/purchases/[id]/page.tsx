'use client'

/**
 * Purchase Detail Page
 * Display purchase details with payment history and add payment functionality
 */

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface Purchase {
  id: string
  supplier: {
    supplierCode: string
    name: string
    phone: string
    location: string
  }
  rawMaterial: {
    materialCode: string
    materialName: string
  }
  quantity: number
  totalAmount: number
  amountPaid: number
  balance: number
  purchaseDate: string
  status: string
  payments: Payment[]
}

interface Payment {
  id: string
  amount: number
  paymentDate: string
  paymentMode: string
  notes: string | null
  createdAt: string
}

export default function PurchaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const purchaseId = params?.id as string

  // State
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [paymentMode, setPaymentMode] = useState<string>('cash')
  const [paymentNotes, setPaymentNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch purchase details
  const fetchPurchase = async () => {
    setLoading(true)
    setError(null)

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
      console.error('Error fetching purchase:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (purchaseId) {
      fetchPurchase()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId])

  // Handle add payment
  const handleAddPayment = async () => {
    if (!purchase) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/purchases/${purchaseId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentDate: paymentDate.toISOString(),
          paymentMode,
          notes: paymentNotes
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add payment')
      }

      if (result.success) {
        setPaymentDialogOpen(false)
        setPaymentAmount(0)
        setPaymentNotes('')
        fetchPurchase() // Refresh purchase data
      } else {
        throw new Error(result.error || 'Failed to add payment')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // Status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'partial':
        return 'info'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  // Payment history columns
  const paymentColumns: GridColDef<Payment>[] = [
    {
      field: 'paymentDate',
      headerName: 'Date',
      width: 150,
      valueFormatter: params =>
        new Date(params).toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 150,
      type: 'number',
      valueFormatter: params =>
        `₦${Number(params).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      field: 'paymentMode',
      headerName: 'Payment Mode',
      width: 150,
      renderCell: params => <span style={{ textTransform: 'capitalize' }}>{params.value}</span>
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: 300,
      valueGetter: (_, row) => row.notes || '-'
    }
  ]

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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box mb={4} display='flex' justifyContent='space-between' alignItems='center'>
          <Box>
            <Typography variant='h4' gutterBottom>
              Purchase Details
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              View and manage purchase transaction
            </Typography>
          </Box>
          <Box display='flex' gap={2}>
            <Button variant='outlined' onClick={() => router.push('/purchases')}>
              Back to List
            </Button>
            <Button variant='outlined' onClick={() => router.push(`/purchases/${purchaseId}/edit`)}>
              <i className='ri-edit-line' style={{ marginRight: '8px' }} />
              Edit Purchase
            </Button>
            {purchase.balance > 0 && (
              <Button variant='contained' onClick={() => setPaymentDialogOpen(true)}>
                <i className='ri-add-line' style={{ marginRight: '8px' }} />
                Add Payment
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Box mb={3}>
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Transaction Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title='Transaction Information' />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant='caption' color='text.secondary'>
                      Supplier
                    </Typography>
                    <Typography variant='body1' fontWeight={500}>
                      {purchase.supplier.supplierCode} - {purchase.supplier.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {purchase.supplier.phone} • {purchase.supplier.location}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='caption' color='text.secondary'>
                      Raw Material
                    </Typography>
                    <Typography variant='body1' fontWeight={500}>
                      {purchase.rawMaterial.materialCode} - {purchase.rawMaterial.materialName}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Purchase Date
                    </Typography>
                    <Typography variant='body1'>
                      {new Date(purchase.purchaseDate).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Quantity
                    </Typography>
                    <Typography variant='body1'>{purchase.quantity.toFixed(2)}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='caption' color='text.secondary'>
                      Status
                    </Typography>
                    <Box mt={0.5}>
                      <Chip
                        label={purchase.status}
                        color={getStatusColor(purchase.status)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title='Payment Summary' />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant='caption' color='text.secondary'>
                      Total Amount
                    </Typography>
                    <Typography variant='h4' fontWeight={600}>
                      ₦
                      {purchase.totalAmount.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='caption' color='text.secondary'>
                      Amount Paid
                    </Typography>
                    <Typography variant='h5' color='success.main' fontWeight={600}>
                      ₦
                      {purchase.amountPaid.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='caption' color='text.secondary'>
                      Balance Payable
                    </Typography>
                    <Typography
                      variant='h5'
                      color={purchase.balance > 0 ? 'error.main' : 'success.main'}
                      fontWeight={600}
                    >
                      ₦
                      {purchase.balance.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                  </Grid>

                  {purchase.balance > 0 && (
                    <Grid item xs={12}>
                      <Alert severity='warning'>
                        Outstanding balance of ₦
                        {purchase.balance.toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{' '}
                        is payable to the supplier.
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment History */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title='Payment History'
                subheader={`${purchase.payments.length} payment(s) recorded`}
              />
              <CardContent>
                {purchase.payments.length > 0 ? (
                  <DataGrid
                    rows={purchase.payments}
                    columns={paymentColumns}
                    autoHeight
                    disableRowSelectionOnClick
                    hideFooter
                  />
                ) : (
                  <Alert severity='info'>No payments recorded yet</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth='sm' fullWidth>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogContent>
            <Box mt={2}>
              <Alert severity='info' sx={{ mb: 3 }}>
                Remaining balance: ₦
                {purchase.balance.toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label='Payment Amount'
                    type='number'
                    fullWidth
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>₦</InputAdornment>,
                      inputProps: { step: '0.01', min: '0', max: purchase.balance }
                    }}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <DatePicker
                    label='Payment Date'
                    value={paymentDate}
                    onChange={(date: Date | null) => setPaymentDate(date || new Date())}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} label='Payment Mode'>
                      <MenuItem value='cash'>Cash</MenuItem>
                      <MenuItem value='transfer'>Bank Transfer</MenuItem>
                      <MenuItem value='cheque'>Cheque</MenuItem>
                      <MenuItem value='others'>Others</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label='Notes (Optional)'
                    fullWidth
                    multiline
                    rows={3}
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder='Add any notes about this payment...'
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment} variant='contained' disabled={submitting || paymentAmount <= 0}>
              {submitting ? <CircularProgress size={24} /> : 'Add Payment'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}
