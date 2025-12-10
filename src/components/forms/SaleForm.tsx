'use client'

/**
 * Sale Form Component
 * Create and edit sales transaction form with multi-product support
 */

import { useEffect, useState, useCallback } from 'react'

import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  Chip,
  IconButton,
  Divider,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import { saleItemInputSchema } from '@/types/salesTypes'

import type { Sale } from '@/types/salesTypes'
import type { Customer } from '@/types/customerTypes'
import type { Product } from '@/types/productTypes'

// Form schema for multi-product sales
const multiProductFormSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  items: z.array(saleItemInputSchema).min(1, 'At least one product is required'),
  supplyDate: z.coerce.date(),
  paymentMode: z.enum(['cash', 'transfer', 'pos', 'credit', 'others']),
  amountPaid: z.number().min(0, 'Amount paid cannot be negative').max(999999999.99, 'Amount paid too large'),
  paymentDate: z.coerce.date().optional().nullable()
}).refine(
  data => {
    if (data.amountPaid > 0 && data.paymentMode !== 'credit') {
      return data.paymentDate !== null && data.paymentDate !== undefined
    }

    return true
  },
  {
    message: 'Payment date is required when amount is paid',
    path: ['paymentDate']
  }
)

type FormData = z.infer<typeof multiProductFormSchema>

interface SaleFormProps {
  sale?: Sale & { customer?: Customer; product?: Product; items?: any[] }
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  error?: string | null
}

export default function SaleForm({ sale, onSubmit, onCancel, isLoading, error }: SaleFormProps) {
  const isEditMode = !!sale

  // States for customer and product options
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [customerOutstanding, setCustomerOutstanding] = useState<number>(0)
  const [customerCreditBalance, setCustomerCreditBalance] = useState<number>(0)
  const [useCreditBalance, setUseCreditBalance] = useState(false)

  // Current line item being added
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [currentQuantity, setCurrentQuantity] = useState<number>(1)
  const [currentPrice, setCurrentPrice] = useState<number>(0)

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    getValues
  } = useForm<FormData>({
    resolver: zodResolver(multiProductFormSchema) as any,
    defaultValues: isEditMode && sale?.items && sale.items.length > 0
      ? {
          customerId: sale.customerId,
          items: sale.items.map((item: any) => ({
            productId: item.productId,
            quantity: parseFloat(item.quantity.toString()),
            price: parseFloat(item.price.toString())
          })),
          supplyDate: new Date(sale.supplyDate),
          paymentMode: sale.paymentMode as any,
          amountPaid: parseFloat(sale.amountPaid.toString()),
          paymentDate: sale.paymentDate ? new Date(sale.paymentDate) : undefined
        }
      : isEditMode && sale
        ? {
            // Backward compatibility: single product sale
            customerId: sale.customerId,
            items: [{
              productId: sale.productId!,
              quantity: parseFloat(sale.quantity.toString()),
              price: parseFloat(sale.price.toString())
            }],
            supplyDate: new Date(sale.supplyDate),
            paymentMode: sale.paymentMode as any,
            amountPaid: parseFloat(sale.amountPaid.toString()),
            paymentDate: sale.paymentDate ? new Date(sale.paymentDate) : undefined
          }
        : {
            customerId: '',
            items: [],
            supplyDate: new Date(),
            paymentMode: 'cash',
            amountPaid: 0,
            paymentDate: undefined
          }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  // Watch form values
  const watchItems = watch('items')
  const watchAmountPaid = watch('amountPaid')
  const watchPaymentMode = watch('paymentMode')
  const watchCustomerId = watch('customerId')

  // Calculate totals
  const calculateTotal = useCallback(() => {
    const items = getValues('items') || []

    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }, [getValues])

  const [calculatedTotal, setCalculatedTotal] = useState(0)
  const [calculatedBalance, setCalculatedBalance] = useState(0)
  const [calculatedStatus, setCalculatedStatus] = useState<'pending' | 'partial' | 'paid'>('pending')
  const [excessPayment, setExcessPayment] = useState(0)

  // Fetch customer outstanding balance and credit balance when customer changes
  useEffect(() => {
    const fetchCustomerOutstanding = async () => {
      if (!watchCustomerId) {
        setCustomerOutstanding(0)
        setCustomerCreditBalance(0)
        setUseCreditBalance(false)

        return
      }

      try {
        const response = await fetch(`/api/customers/${watchCustomerId}/outstanding`)
        const result = await response.json()

        if (result.success) {
          setCustomerOutstanding(result.data.totalOutstanding || 0)
          setCustomerCreditBalance(result.data.creditBalance || 0)
        }
      } catch (err) {
        console.error('Failed to fetch customer outstanding:', err)
        setCustomerOutstanding(0)
        setCustomerCreditBalance(0)
      }
    }

    fetchCustomerOutstanding()
  }, [watchCustomerId])

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
    if (currentProduct && currentProduct.price) {
      setCurrentPrice(parseFloat(currentProduct.price.toString()))
    }
  }, [currentProduct])

  // Auto-calculate total, balance, and status
  useEffect(() => {
    const total = calculateTotal()
    const amountPaid = Number(watchAmountPaid) || 0

    // If using credit balance, include it in the effective payment
    const creditUsed = useCreditBalance ? Math.min(customerCreditBalance, total) : 0
    const totalPayment = amountPaid + creditUsed

    const balance = total - totalPayment

    // Calculate excess payment
    const excess = totalPayment > total ? totalPayment - total : 0

    setCalculatedTotal(total)
    setCalculatedBalance(balance)
    setExcessPayment(excess)

    // Determine status
    if (totalPayment === 0) {
      setCalculatedStatus('pending')
    } else if (totalPayment < total) {
      setCalculatedStatus('partial')
    } else {
      setCalculatedStatus('paid')
    }
  }, [watchItems, watchAmountPaid, useCreditBalance, customerCreditBalance, calculateTotal])

  // Add item to the items list
  const handleAddItem = () => {
    if (!currentProduct || currentQuantity <= 0 || currentPrice <= 0) {
      return
    }

    append({
      productId: currentProduct.id,
      quantity: currentQuantity,
      price: currentPrice
    })

    // Reset current item fields
    setCurrentProduct(null)
    setCurrentQuantity(1)
    setCurrentPrice(0)
  }

  // Get product name by ID
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)

    return product ? `${product.productCode} - ${product.productName}` : productId
  }

  const handleFormSubmit = async (data: FormData) => {
    // Include credit balance usage in the submission
    const submitData = {
      ...data,
      useCreditBalance: useCreditBalance && customerCreditBalance > 0,
      creditBalanceToUse: useCreditBalance ? Math.min(customerCreditBalance, calculatedTotal) : 0
    }

    await onSubmit(submitData as any)
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

                          return customer ? `${customer.customerCode} - ${customer.businessName}` : option
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

              {/* Customer Credit Balance Alert */}
              {customerCreditBalance > 0 && (
                <Grid item xs={12}>
                  <Alert severity='success' icon={<i className='ri-coins-line' />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Box>
                        <Typography variant='body2' fontWeight={600}>
                          Customer has a credit balance of ₦{customerCreditBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                        <Typography variant='caption'>
                          This credit can be applied to this sale to reduce the amount due.
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={useCreditBalance}
                            onChange={(e) => setUseCreditBalance(e.target.checked)}
                            size='small'
                          />
                        }
                        label='Use Credit'
                        sx={{ ml: 2 }}
                      />
                    </Box>
                  </Alert>
                </Grid>
              )}

              {/* Customer Outstanding Balance Alert */}
              {customerOutstanding > 0 && (
                <Grid item xs={12}>
                  <Alert severity='info' icon={<i className='ri-wallet-3-line' />}>
                    <Typography variant='body2' fontWeight={600}>
                      Customer has an outstanding balance of ₦{customerOutstanding.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant='caption'>
                      You can accept payment that exceeds this sale total to clear part or all of the outstanding balance.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Chip label='Products' size='small' />
                </Divider>
              </Grid>

              {/* Add Product Section */}
              <Grid item xs={12}>
                <Paper variant='outlined' sx={{ p: 3 }}>
                  <Typography variant='subtitle2' gutterBottom sx={{ mb: 2 }}>
                    Add Products to Sale
                  </Typography>
                  <Grid container spacing={2} alignItems='flex-end'>
                    {/* Product Selection */}
                    <Grid item xs={12} md={4}>
                      <Autocomplete
                        options={products}
                        getOptionLabel={option => `${option.productCode} - ${option.productName}`}
                        loading={loadingProducts}
                        onChange={(_, data) => setCurrentProduct(data)}
                        value={currentProduct}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Select Product'
                            size='small'
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
                    </Grid>

                    {/* Quantity */}
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        label='Quantity'
                        type='number'
                        size='small'
                        value={currentQuantity}
                        onChange={e => setCurrentQuantity(e.target.value ? parseFloat(e.target.value) : 0)}
                        inputProps={{ min: 0.01, step: 0.01 }}
                      />
                    </Grid>

                    {/* Price */}
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        label='Unit Price (₦)'
                        type='number'
                        size='small'
                        value={currentPrice}
                        onChange={e => setCurrentPrice(e.target.value ? parseFloat(e.target.value) : 0)}
                        inputProps={{ min: 0.01, step: 0.01 }}
                      />
                    </Grid>

                    {/* Subtotal Display */}
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        label='Subtotal (₦)'
                        size='small'
                        value={(currentQuantity * currentPrice).toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>

                    {/* Add Button */}
                    <Grid item xs={6} md={2}>
                      <Button
                        variant='contained'
                        fullWidth
                        onClick={handleAddItem}
                        disabled={!currentProduct || currentQuantity <= 0 || currentPrice <= 0}
                        startIcon={<i className='ri-add-line' />}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Items Table */}
              {fields.length > 0 && (
                <Grid item xs={12}>
                  <Paper variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align='right'>Quantity</TableCell>
                          <TableCell align='right'>Unit Price (₦)</TableCell>
                          <TableCell align='right'>Subtotal (₦)</TableCell>
                          <TableCell align='center' width={60}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fields.map((field, index) => {
                          const item = watchItems[index]
                          const subtotal = item ? item.quantity * item.price : 0

                          return (
                            <TableRow key={field.id}>
                              <TableCell>{getProductName(item?.productId || '')}</TableCell>
                              <TableCell align='right'>{item?.quantity?.toLocaleString() || 0}</TableCell>
                              <TableCell align='right'>₦{item?.price?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) || '0.00'}</TableCell>
                              <TableCell align='right'>₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell align='center'>
                                <IconButton
                                  size='small'
                                  color='error'
                                  onClick={() => remove(index)}
                                >
                                  <i className='ri-delete-bin-line' />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {/* Total Row */}
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell colSpan={3}>
                            <Typography variant='subtitle2' fontWeight={600}>Total</Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='subtitle2' fontWeight={600} color='primary'>
                              ₦{calculatedTotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>
                </Grid>
              )}

              {/* Items validation error */}
              {errors.items && (
                <Grid item xs={12}>
                  <Alert severity='error'>
                    {typeof errors.items.message === 'string'
                      ? errors.items.message
                      : 'At least one product is required'}
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Chip label='Payment' size='small' />
                </Divider>
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
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
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

              {/* Credit Balance Usage Info */}
              {useCreditBalance && customerCreditBalance > 0 && (
                <Grid item xs={12}>
                  <Alert severity='info' icon={<i className='ri-bank-card-line' />}>
                    <Typography variant='body2' fontWeight={600}>
                      Using ₦{Math.min(customerCreditBalance, calculatedTotal).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from credit balance
                    </Typography>
                    <Typography variant='caption'>
                      {customerCreditBalance >= calculatedTotal
                        ? `Remaining credit after this sale: ₦${(customerCreditBalance - calculatedTotal).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `Full credit balance will be applied. Remaining to pay: ₦${(calculatedTotal - customerCreditBalance).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </Typography>
                  </Alert>
                </Grid>
              )}

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

              {/* Excess Payment Info - Will be applied to outstanding balance */}
              {excessPayment > 0 && customerOutstanding > 0 && (
                <Grid item xs={12}>
                  <Alert severity='success' icon={<i className='ri-money-dollar-circle-line' />}>
                    <Typography variant='body2' fontWeight={600}>
                      Excess Payment: ₦{excessPayment.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant='caption'>
                      This amount will be applied to the customer&apos;s outstanding balance of ₦{customerOutstanding.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                      {excessPayment >= customerOutstanding
                        ? ' Outstanding balance will be fully cleared.'
                        : ` Remaining outstanding after this payment: ₦${(customerOutstanding - excessPayment).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {/* Excess Payment Warning - No outstanding to apply */}
              {excessPayment > 0 && customerOutstanding === 0 && (
                <Grid item xs={12}>
                  <Alert severity='warning'>
                    <Typography variant='body2' fontWeight={500}>
                      Warning: Payment exceeds sale total by ₦{excessPayment.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant='caption'>
                      This customer has no outstanding balance. The excess payment will create a credit on their account.
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
                  <Button type='submit' variant='contained' disabled={isLoading || fields.length === 0}>
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
