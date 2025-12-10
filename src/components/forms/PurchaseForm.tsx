'use client'

/**
 * Purchase Form Component
 * Reusable form for creating and editing purchase transactions
 */

import { useEffect, useState } from 'react'

import { useForm, Controller } from 'react-hook-form'
import {
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Alert,
  InputAdornment,
  Typography,
  FormHelperText
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface Supplier {
  id: string
  supplierCode: string
  name: string
  location: string
}

interface RawMaterial {
  id: string
  materialCode: string
  materialName: string
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

interface PurchaseFormProps {
  initialData?: Partial<PurchaseFormData>
  onSubmit: (data: PurchaseFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export default function PurchaseForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Purchase'
}: PurchaseFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PurchaseFormData>({
    defaultValues: {
      supplierId: initialData?.supplierId || '',
      rawMaterialId: initialData?.rawMaterialId || '',
      quantity: initialData?.quantity || 0,
      totalAmount: initialData?.totalAmount || 0,
      amountPaid: initialData?.amountPaid || 0,
      purchaseDate: initialData?.purchaseDate || new Date(),
      paymentMode: initialData?.paymentMode || 'cash',
      notes: initialData?.notes || ''
    }
  })

  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [loadingRawMaterials, setLoadingRawMaterials] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Watch fields for auto-calculation
  const totalAmount = watch('totalAmount')
  const amountPaid = watch('amountPaid')

  // Calculate balance
  const balance = totalAmount - amountPaid

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('/api/suppliers?limit=1000')
        const result = await response.json()

        if (result.success) {
          setSuppliers(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch suppliers')
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err)
        setError('Failed to load suppliers')
      } finally {
        setLoadingSuppliers(false)
      }
    }

    fetchSuppliers()
  }, [])

  // Fetch raw materials
  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        const response = await fetch('/api/raw-materials?limit=1000')
        const result = await response.json()

        if (result.success) {
          setRawMaterials(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch raw materials')
        }
      } catch (err) {
        console.error('Error fetching raw materials:', err)
        setError('Failed to load raw materials')
      } finally {
        setLoadingRawMaterials(false)
      }
    }

    fetchRawMaterials()
  }, [])

  const handleFormSubmit = async (data: PurchaseFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loadingSuppliers || loadingRawMaterials) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {error && (
          <Box mb={3}>
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Supplier & Raw Material Selection */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='Purchase Details' />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name='supplierId'
                      control={control}
                      rules={{ required: 'Supplier is required' }}
                      render={({ field: { onChange, value } }) => (
                        <Autocomplete
                          options={suppliers}
                          getOptionLabel={option => `${option.supplierCode} - ${option.name}`}
                          value={suppliers.find(s => s.id === value) || null}
                          onChange={(_, newValue) => onChange(newValue?.id || '')}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Supplier *'
                              error={!!errors.supplierId}
                              helperText={errors.supplierId?.message}
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component='li' {...props} key={option.id}>
                              <Box>
                                <Typography variant='body2' fontWeight={500}>
                                  {option.supplierCode} - {option.name}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {option.location}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='rawMaterialId'
                      control={control}
                      rules={{ required: 'Raw material is required' }}
                      render={({ field: { onChange, value } }) => (
                        <Autocomplete
                          options={rawMaterials}
                          getOptionLabel={option => `${option.materialCode} - ${option.materialName}`}
                          value={rawMaterials.find(rm => rm.id === value) || null}
                          onChange={(_, newValue) => onChange(newValue?.id || '')}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Raw Material *'
                              error={!!errors.rawMaterialId}
                              helperText={errors.rawMaterialId?.message}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='purchaseDate'
                      control={control}
                      rules={{ required: 'Purchase date is required' }}
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          label='Purchase Date *'
                          value={value}
                          onChange={onChange}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.purchaseDate,
                              helperText: errors.purchaseDate?.message
                            }
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='quantity'
                      control={control}
                      rules={{
                        required: 'Quantity is required',
                        min: { value: 0.01, message: 'Quantity must be greater than 0' }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type='number'
                          label='Quantity *'
                          fullWidth
                          error={!!errors.quantity}
                          helperText={errors.quantity?.message}
                          inputProps={{ step: '0.01', min: '0.01' }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='totalAmount'
                      control={control}
                      rules={{
                        required: 'Total amount is required',
                        min: { value: 0.01, message: 'Total amount must be greater than 0' }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type='number'
                          label='Total Amount *'
                          fullWidth
                          error={!!errors.totalAmount}
                          helperText={errors.totalAmount?.message}
                          InputProps={{
                            startAdornment: <InputAdornment position='start'>₦</InputAdornment>,
                            inputProps: { step: '0.01', min: '0.01' }
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Information */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='Payment Information' />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name='amountPaid'
                      control={control}
                      rules={{
                        required: 'Amount paid is required',
                        min: { value: 0, message: 'Amount paid cannot be negative' },
                        validate: value =>
                          value <= totalAmount + 0.01 || 'Amount paid cannot exceed total amount'
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type='number'
                          label='Amount Paid *'
                          fullWidth
                          error={!!errors.amountPaid}
                          helperText={errors.amountPaid?.message}
                          InputProps={{
                            startAdornment: <InputAdornment position='start'>₦</InputAdornment>,
                            inputProps: { step: '0.01', min: '0' }
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='paymentMode'
                      control={control}
                      rules={{ required: 'Payment mode is required' }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.paymentMode}>
                          <InputLabel>Payment Mode *</InputLabel>
                          <Select {...field} label='Payment Mode *'>
                            <MenuItem value='cash'>Cash</MenuItem>
                            <MenuItem value='transfer'>Bank Transfer</MenuItem>
                            <MenuItem value='cheque'>Cheque</MenuItem>
                            <MenuItem value='credit'>Credit</MenuItem>
                            <MenuItem value='others'>Others</MenuItem>
                          </Select>
                          {errors.paymentMode && (
                            <FormHelperText>{errors.paymentMode.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name='notes'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Notes (Optional)'
                          fullWidth
                          multiline
                          rows={3}
                          placeholder='Add any additional notes about this purchase...'
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Summary */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='Payment Summary' />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        Total Amount
                      </Typography>
                      <Typography variant='h6' fontWeight={600}>
                        ₦{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        Amount Paid
                      </Typography>
                      <Typography variant='h6' color='success.main' fontWeight={600}>
                        ₦{amountPaid.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        Balance Payable
                      </Typography>
                      <Typography
                        variant='h6'
                        color={balance > 0 ? 'error.main' : 'success.main'}
                        fontWeight={600}
                      >
                        ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>

                  {balance > 0 && (
                    <Grid item xs={12}>
                      <Alert severity='warning'>
                        This is a credit purchase. Balance of ₦
                        {balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is
                        payable to the supplier.
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box mt={3} display='flex' gap={2} justifyContent='flex-end'>
          {onCancel && (
            <Button variant='outlined' onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type='submit' variant='contained' disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : submitLabel}
          </Button>
        </Box>
      </form>
    </LocalizationProvider>
  )
}
