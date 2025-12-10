'use client'

/**
 * Sale Detail Page
 * View sale transaction details and payment history
 */

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import type { Sale, SalePayment, SaleItem } from '@/types/salesTypes'
import type { Customer } from '@/types/customerTypes'
import type { Product } from '@/types/productTypes'

interface SaleItemWithProduct extends SaleItem {
  product: Pick<Product, 'id' | 'productCode' | 'productName'>
}

interface SaleWithDetails extends Sale {
  customer: Pick<Customer, 'id' | 'customerCode' | 'businessName' | 'phone' | 'location'>
  product: Pick<Product, 'id' | 'productCode' | 'productName' | 'price'> | null
  items: SaleItemWithProduct[]
  payments: SalePayment[]
}

export default function SaleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const saleId = params?.id as string

  const [sale, setSale] = useState<SaleWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentDate, setPaymentDate] = useState<Date | null>(new Date())
  const [paymentMode, setPaymentMode] = useState<string>('cash')
  const [paymentNotes, setPaymentNotes] = useState<string>('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Fetch sale details
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

  useEffect(() => {
    if (saleId) {
      fetchSale()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId])

  // Handle add payment
  const handleAddPayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than 0')

      return
    }

    if (!paymentDate) {
      setPaymentError('Payment date is required')

      return
    }

    setPaymentLoading(true)
    setPaymentError(null)

    try {
      const response = await fetch(`/api/sales/${saleId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentDate: paymentDate.toISOString(),
          paymentMode,
          notes: paymentNotes || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to add payment')
      }

      if (result.success) {
        // Refresh sale data
        await fetchSale()

        // Close dialog and reset form
        setPaymentDialogOpen(false)
        setPaymentAmount(0)
        setPaymentDate(new Date())
        setPaymentMode('cash')
        setPaymentNotes('')
      } else {
        throw new Error(result.error || 'Failed to add payment')
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error adding payment:', err)
    } finally {
      setPaymentLoading(false)
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
        <Button variant='outlined' onClick={() => router.push('/sales')} sx={{ mt: 2 }}>
          Back to Sales List
        </Button>
      </Box>
    )
  }

  const balance = Number(sale.balance)
  const canAddPayment = balance > 0

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box mb={4} display='flex' justifyContent='space-between' alignItems='center'>
          <Box>
            <Typography variant='h4' gutterBottom>
              Sale Details
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              View transaction details and payment history
            </Typography>
          </Box>
          <Box display='flex' gap={2}>
            <Button variant='outlined' onClick={() => router.push('/sales')}>
              Back to List
            </Button>
            <Button variant='outlined' color='info' onClick={() => router.push(`/sales/${saleId}/edit`)}>
              Edit Sale
            </Button>
            {canAddPayment && (
              <Button variant='contained' color='success' onClick={() => setPaymentDialogOpen(true)}>
                Add Payment
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Sale Information Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                title='Transaction Information'
                action={<Chip label={sale.status.toUpperCase()} color={getStatusColor(sale.status)} />}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Customer
                    </Typography>
                    <Typography variant='body1' fontWeight={500}>
                      {sale.customer.customerCode} - {sale.customer.businessName}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {sale.customer.location} • {sale.customer.phone}
                    </Typography>
                  </Grid>

                  {/* Only show legacy single product if no items */}
                  {(!sale.items || sale.items.length === 0) && sale.product && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Product
                      </Typography>
                      <Typography variant='body1' fontWeight={500}>
                        {sale.product.productCode} - {sale.product.productName}
                      </Typography>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Supply Date
                    </Typography>
                    <Typography variant='body1'>
                      {new Date(sale.supplyDate).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Payment Mode
                    </Typography>
                    <Typography variant='body1' sx={{ textTransform: 'capitalize' }}>
                      {sale.paymentMode}
                    </Typography>
                  </Grid>

                  {/* Show legacy single product info if no items */}
                  {(!sale.items || sale.items.length === 0) && sale.product && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Quantity
                        </Typography>
                        <Typography variant='body1'>{Number(sale.quantity).toFixed(2)}</Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Unit Price
                        </Typography>
                        <Typography variant='body1'>
                          ₦
                          {Number(sale.price).toLocaleString('en-NG', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>

                {/* Products List for Multi-Product Sales */}
                {sale.items && sale.items.length > 0 && (
                  <Box mt={3}>
                    <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                      Products ({sale.items.length} item{sale.items.length > 1 ? 's' : ''})
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell>#</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell align='right'>Qty</TableCell>
                            <TableCell align='right'>Unit Price</TableCell>
                            <TableCell align='right'>Subtotal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sale.items.map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Typography variant='body2' fontWeight={500}>
                                  {item.product.productCode} - {item.product.productName}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>{Number(item.quantity).toFixed(2)}</TableCell>
                              <TableCell align='right'>
                                ₦{Number(item.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell align='right'>
                                <Typography fontWeight={500}>
                                  ₦{Number(item.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ backgroundColor: 'action.selected' }}>
                            <TableCell colSpan={4} align='right'>
                              <Typography fontWeight={600}>Total:</Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography fontWeight={600}>
                                ₦{Number(sale.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Summary Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title='Payment Summary' />
              <CardContent>
                <Box mb={2}>
                  <Typography variant='caption' color='text.secondary'>
                    Total Amount
                  </Typography>
                  <Typography variant='h5' fontWeight={600}>
                    ₦
                    {Number(sale.total).toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant='caption' color='text.secondary'>
                    Amount Paid
                  </Typography>
                  <Typography variant='h6' color='success.main' fontWeight={500}>
                    ₦
                    {Number(sale.amountPaid).toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Balance
                  </Typography>
                  <Typography
                    variant='h5'
                    fontWeight={700}
                    color={balance > 0 ? 'error.main' : 'success.main'}
                  >
                    ₦
                    {balance.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Typography>
                </Box>

                {balance > 0 && (
                  <Alert severity='warning' sx={{ mt: 2 }}>
                    Outstanding balance of ₦
                    {balance.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Payment History */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title='Payment History'
                subheader={`${sale.payments?.length || 0} payment(s) recorded`}
              />
              <CardContent>
                {sale.payments && sale.payments.length > 0 ? (
                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Payment Mode</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sale.payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.paymentDate).toLocaleDateString('en-NG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={500}>
                                ₦
                                {Number(payment.amount).toLocaleString('en-NG', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>
                              {payment.paymentMode}
                            </TableCell>
                            <TableCell>{payment.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity='info'>No payment history available</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth='sm' fullWidth>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity='info'>
                    Remaining balance: ₦
                    {balance.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Alert>
                </Grid>

                {paymentError && (
                  <Grid item xs={12}>
                    <Alert severity='error'>{paymentError}</Alert>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Payment Amount (₦)'
                    type='number'
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    inputProps={{ min: 0, max: balance, step: 0.01 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <DatePicker
                    label='Payment Date'
                    value={paymentDate}
                    onChange={(date: Date | null) => setPaymentDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} label='Payment Mode'>
                      <MenuItem value='cash'>Cash</MenuItem>
                      <MenuItem value='transfer'>Bank Transfer</MenuItem>
                      <MenuItem value='pos'>POS</MenuItem>
                      <MenuItem value='others'>Others</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Notes (Optional)'
                    multiline
                    rows={3}
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)} disabled={paymentLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment} variant='contained' disabled={paymentLoading}>
              {paymentLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              Add Payment
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}
