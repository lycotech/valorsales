'use client'

/**
 * Sale Form Component
 * Create and edit sales transaction form with validation
 */

import { useEffect, useState } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  FormControl,
  FormHelperText,
  Alert,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Chip
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import { createSaleSchema, updateSaleSchema } from '@/types/salesTypes'

import type { Sale, CreateSaleInput, UpdateSaleInput } from '@/types/salesTypes'
import type { Customer } from '@/types/customerTypes'
import type { Product } from '@/types/productTypes'

interface SaleFormProps {
  sale?: Sale & { customer?: Customer; product?: Product }
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  error?: string | null
}

export default function SaleForm({ sale, onSubmit, onCancel, isLoading, error }: SaleFormProps) {
  const isEditMode = !!sale

  const schema = isEditMode ? updateSaleSchema : createSaleSchema

  // States for customer and product options
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  // State for calculated values
  const [calculatedTotal, setCalculatedTotal] = useState(0)
  const [calculatedBalance, setCalculatedBalance] = useState(0)
  const [calculatedStatus, setCalculatedStatus] = useState<'pending' | 'partial' | 'paid'>('pending')

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: isEditMode
      ? {
          customerId: sale.customerId,
          productId: sale.productId,
          quantity: parseFloat(sale.quantity.toString()),
          price: parseFloat(sale.price.toString()),
          amountPaid: parseFloat(sale.amountPaid.toString()),
          paymentMode: sale.paymentMode as any,
          supplyDate: sale.supplyDate,
          paymentDate: sale.paymentDate || undefined
        }
      : {
          customerId: '',
          productId: '',
          quantity: 1,
          price: 0,
          amountPaid: 0,
          paymentMode: 'cash',
          supplyDate: new Date(),
          paymentDate: undefined
        }
  })

  // Watch form values for auto-calculation
  const watchQuantity = watch('quantity')
  const watchPrice = watch('price')
  const watchAmountPaid = watch('amountPaid')
  const watchPaymentMode = watch('paymentMode')
  const watchProductId = watch('productId')

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true)

      try {
        const response = await fetch('/api/customers?page=1&pageSize=1000')
        const result = await response.json()

        if (result.success) {
          setCustomers(result.data)
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err)
      } finally {
        setLoadingCustomers(false)
      }
    }

    fetchCustomers()
  }, [])

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true)

      try {
        const response = await fetch('/api/products?page=1&pageSize=1000')
        const result = await response.json()

        if (result.success) {
          setProducts(result.data)
        }
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  // Auto-fill price when product is selected
  useEffect(() => {
    if (watchProductId && !isEditMode) {
      const selectedProduct = products.find(p => p.id === watchProductId)

      if (selectedProduct && selectedProduct.price) {
        setValue('price', parseFloat(selectedProduct.price.toString()))
      }
    }
  }, [watchProductId, products, isEditMode, setValue])

  // Auto-calculate total, balance, and status
  useEffect(() => {
    const quantity = Number(watchQuantity) || 0
    const price = Number(watchPrice) || 0
    const amountPaid = Number(watchAmountPaid) || 0

    const total = quantity * price
    const balance = total - amountPaid

    setCalculatedTotal(total)
    setCalculatedBalance(balance)

    // Determine status
    if (amountPaid === 0) {
      setCalculatedStatus('pending')
    } else if (amountPaid < total) {
      setCalculatedStatus('partial')
    } else {
      setCalculatedStatus('paid')
    }
  }, [watchQuantity, watchPrice, watchAmountPaid])

  // Reset form when sale changes
  useEffect(() => {
    if (sale) {
      reset({
        customerId: sale.customerId,
        productId: sale.productId,
        quantity: parseFloat(sale.quantity.toString()),
        price: parseFloat(sale.price.toString()),
        amountPaid: parseFloat(sale.amountPaid.toString()),
        paymentMode: sale.paymentMode as any,
        supplyDate: sale.supplyDate,
        paymentDate: sale.paymentDate || undefined
      })
    }
  }, [sale, reset])

  const handleFormSubmit = async (data: z.infer<typeof schema>) => {
    await onSubmit(data as CreateSaleInput | UpdateSaleInput)
  }

  const getStatusColor = (status: 'pending' | 'partial' | 'paid') => {
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card>
        <CardHeader title={isEditMode ? 'Edit Sale' : 'New Sale Transaction'} />
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
            <Grid container spacing={5}>
              {/* Customer Selection */}
              <Grid item xs={12} md={6}>
                <Controller
                  name='customerId'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={customers}
                      getOptionLabel={option => {
                        if (typeof option === 'string') {
                          const customer = customers.find(c => c.id === option)

                          return customer
                            ? `${customer.customerCode} - ${customer.businessName}`
                            : option
                        }

                        return `${option.customerCode} - ${option.businessName}`
                      }}
                      loading={loadingCustomers}
                      onChange={(_, data) => field.onChange(data?.id || '')}
                      value={customers.find(c => c.id === field.value) || null}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Customer *'
                          error={!!errors.customerId}
                          helperText={errors.customerId?.message?.toString()}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingCustomers ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} key={option.id}>
                          <Box>
                            <Typography variant='body2' fontWeight={500}>
                              {option.customerCode} - {option.businessName}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {option.location} • {option.phone}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Product Selection */}
              <Grid item xs={12} md={6}>
                <Controller
                  name='productId'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={products}
                      getOptionLabel={option => {
                        if (typeof option === 'string') {
                          const product = products.find(p => p.id === option)

                          return product ? `${product.productCode} - ${product.productName}` : option
                        }

                        return `${option.productCode} - ${option.productName}`
                      }}
                      loading={loadingProducts}
                      onChange={(_, data) => field.onChange(data?.id || '')}
                      value={products.find(p => p.id === field.value) || null}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Product *'
                          error={!!errors.productId}
                          helperText={errors.productId?.message?.toString()}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingProducts ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} key={option.id}>
                          <Box>
                            <Typography variant='body2' fontWeight={500}>
                              {option.productCode} - {option.productName}
                            </Typography>
                            {option.price && (
                              <Typography variant='caption' color='text.secondary'>
                                Price: ₦{parseFloat(option.price.toString()).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Quantity */}
              <Grid item xs={12} md={4}>
                <Controller
                  name='quantity'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Quantity *'
                      type='number'
                      inputProps={{ min: 1, step: 0.01 }}
                      error={!!errors.quantity}
                      helperText={errors.quantity?.message?.toString()}
                    />
                  )}
                />
              </Grid>

              {/* Price */}
              <Grid item xs={12} md={4}>
                <Controller
                  name='price'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Unit Price (₦) *'
                      type='number'
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors.price}
                      helperText={errors.price?.message?.toString()}
                    />
                  )}
                />
              </Grid>

              {/* Total (Read-only, calculated) */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Total (₦)'
                  value={calculatedTotal.toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                  InputProps={{
                    readOnly: true
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontWeight: 600,
                      color: 'primary.main'
                    }
                  }}
                />
              </Grid>

              {/* Supply Date */}
              <Grid item xs={12} md={6}>
                <Controller
                  name='supplyDate'
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label='Supply Date *'
                      value={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.supplyDate,
                          helperText: errors.supplyDate?.message?.toString()
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Payment Mode */}
              <Grid item xs={12} md={6}>
                <Controller
                  name='paymentMode'
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.paymentMode}>
                      <FormLabel>Payment Mode *</FormLabel>
                      <RadioGroup {...field} row>
                        <FormControlLabel value='cash' control={<Radio />} label='Cash' />
                        <FormControlLabel value='transfer' control={<Radio />} label='Bank Transfer' />
                        <FormControlLabel value='pos' control={<Radio />} label='POS' />
                        <FormControlLabel value='credit' control={<Radio />} label='Credit' />
                        <FormControlLabel value='others' control={<Radio />} label='Others' />
                      </RadioGroup>
                      {errors.paymentMode && (
                        <FormHelperText>{errors.paymentMode.message?.toString()}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Amount Paid */}
              <Grid item xs={12} md={6}>
                <Controller
                  name='amountPaid'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Amount Paid (₦) *'
                      type='number'
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors.amountPaid}
                      helperText={errors.amountPaid?.message?.toString()}
                    />
                  )}
                />
              </Grid>

              {/* Payment Date (Conditional) */}
              {watchPaymentMode !== 'credit' && Number(watchAmountPaid) > 0 && (
                <Grid item xs={12} md={6}>
                  <Controller
                    name='paymentDate'
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label='Payment Date *'
                        value={field.value || null}
                        onChange={(date: Date | null) => field.onChange(date)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.paymentDate,
                            helperText: errors.paymentDate?.message?.toString()
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Balance Display */}
              <Grid item xs={12} md={watchPaymentMode === 'credit' || Number(watchAmountPaid) === 0 ? 12 : 6}>
                <TextField
                  fullWidth
                  label='Balance (₦)'
                  value={calculatedBalance.toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <Chip
                        label={calculatedStatus.toUpperCase()}
                        color={getStatusColor(calculatedStatus)}
                        size='small'
                        sx={{ mr: 1 }}
                      />
                    )
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontWeight: 600,
                      color: calculatedBalance > 0 ? 'error.main' : 'success.main'
                    }
                  }}
                />
              </Grid>

              {/* Credit Sale Warning */}
              {calculatedBalance > 0 && (
                <Grid item xs={12}>
                  <Alert severity='warning'>
                    <Typography variant='body2' fontWeight={500}>
                      Credit Sale: Outstanding balance of ₦
                      {calculatedBalance.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                    <Typography variant='caption'>
                      This transaction will be tracked as a credit sale. Partial payments can be recorded later.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {/* Error Alert */}
              {error && (
                <Grid item xs={12}>
                  <Alert severity='error'>{error}</Alert>
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant='outlined' color='secondary' onClick={onCancel} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type='submit' variant='contained' disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        {isEditMode ? 'Updating...' : 'Creating...'}
                      </>
                    ) : isEditMode ? (
                      'Update Sale'
                    ) : (
                      'Create Sale'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </LocalizationProvider>
  )
}
