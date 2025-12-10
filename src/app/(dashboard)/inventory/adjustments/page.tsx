'use client'

import { useEffect, useState, useCallback } from 'react'

import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  FormControl,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete
} from '@mui/material'

type InventoryItem = {
  id: string
  name: string
  code: string
  quantity: number
  unit: string
  type: 'product' | 'raw_material'
}

type AdjustmentTransaction = {
  id: string
  type: string
  transactionType: string
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  notes: string | null
  createdAt: string
  productInventory?: {
    product: {
      productName: string
      productCode: string
    }
  }
  rawMaterialInventory?: {
    rawMaterial: {
      materialName: string
      materialCode: string
    }
  }
}

type PaginationInfo = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export default function StockAdjustmentsPage() {
  const [transactions, setTransactions] = useState<AdjustmentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  })

  // Form state
  const [inventoryType, setInventoryType] = useState<'product' | 'raw_material'>('product')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        type: 'adjustment'
      })

      const response = await fetch(`/api/inventory/transactions?${params}`)

      if (response.ok) {
        const data = await response.json()

        setTransactions(data.data || [])
        setPagination(prev => ({
          ...prev,
          totalCount: data.pagination?.totalCount || 0,
          totalPages: data.pagination?.totalPages || 0
        }))
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize])

  const fetchInventoryItems = useCallback(async () => {
    setLoadingItems(true)

    try {
      const endpoint =
        inventoryType === 'product' ? '/api/inventory/products' : '/api/inventory/raw-materials'

      const response = await fetch(`${endpoint}?pageSize=100`)

      if (response.ok) {
        const data = await response.json()

        const items: InventoryItem[] = (data.data || []).map((item: any) => ({
          id: item.id,
          name:
            inventoryType === 'product'
              ? item.product?.productName
              : item.rawMaterial?.materialName,
          code:
            inventoryType === 'product'
              ? item.product?.productCode
              : item.rawMaterial?.materialCode,
          quantity: item.quantity,
          unit: item.unit,
          type: inventoryType
        }))

        setInventoryItems(items)
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error)
    } finally {
      setLoadingItems(false)
    }
  }, [inventoryType])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    if (dialogOpen) {
      fetchInventoryItems()
    }
  }, [dialogOpen, fetchInventoryItems])

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }))
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({ ...prev, pageSize: parseInt(event.target.value, 10), page: 1 }))
  }

  const handleOpenDialog = () => {
    setDialogOpen(true)
    setError(null)
    setSuccess(null)
    setSelectedItem(null)
    setQuantity('')
    setReason('')
    setAdjustmentType('add')
    setInventoryType('product')
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
  }

  const handleSubmit = async () => {
    if (!selectedItem) {
      setError('Please select an item')

      return
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity')

      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the adjustment')

      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          inventoryType: selectedItem.type,
          adjustmentType,
          quantity: parseFloat(quantity),
          reason: reason.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Stock adjustment completed successfully')
        setDialogOpen(false)
        fetchTransactions()
      } else {
        setError(data.error || 'Failed to adjust stock')
      }
    } catch (error) {
      setError('An error occurred while adjusting stock')
    } finally {
      setSubmitting(false)
    }
  }

  const getTransactionChip = (type: string) => {
    switch (type) {
      case 'sale':
        return <Chip label='Sale' color='primary' size='small' />
      case 'purchase':
        return <Chip label='Purchase' color='info' size='small' />
      case 'adjustment':
        return <Chip label='Adjustment' color='warning' size='small' />
      case 'return':
        return <Chip label='Return' color='secondary' size='small' />
      default:
        return <Chip label={type} size='small' />
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold'>
            Stock Adjustments
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Manage manual stock adjustments and view transaction history
          </Typography>
        </div>
        <Button variant='contained' color='primary' onClick={handleOpenDialog} startIcon={<i className='ri-add-line' />}>
          New Adjustment
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity='success' onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Recent Adjustments Table */}
      <Card>
        <CardContent>
          <Box className='flex items-center justify-between mb-4'>
            <Typography variant='h6'>Adjustment History</Typography>
            <Tooltip title='Refresh'>
              <IconButton onClick={fetchTransactions} color='primary'>
                <i className='ri-refresh-line' />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align='right'>Change</TableCell>
                <TableCell align='right'>Before</TableCell>
                <TableCell align='right'>After</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    <Typography color='textSecondary' className='py-8'>
                      No adjustment records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map(tx => (
                  <TableRow key={tx.id} hover>
                    <TableCell>
                      <Typography variant='body2'>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' className='font-medium'>
                        {tx.productInventory?.product?.productName ||
                          tx.rawMaterialInventory?.rawMaterial?.materialName ||
                          'Unknown'}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        {tx.productInventory?.product?.productCode ||
                          tx.rawMaterialInventory?.rawMaterial?.materialCode ||
                          ''}
                      </Typography>
                    </TableCell>
                    <TableCell>{getTransactionChip(tx.transactionType)}</TableCell>
                    <TableCell align='right'>
                      <Typography
                        variant='body2'
                        className='font-semibold'
                        color={tx.quantityChange > 0 ? 'success.main' : 'error.main'}
                      >
                        {tx.quantityChange > 0 ? '+' : ''}
                        {tx.quantityChange}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2'>{tx.quantityBefore}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' className='font-semibold'>
                        {tx.quantityAfter}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='textSecondary'>
                        {tx.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component='div'
          count={pagination.totalCount}
          page={pagination.page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.pageSize}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>New Stock Adjustment</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-2'>
            {error && <Alert severity='error'>{error}</Alert>}

            <FormControl>
              <Typography variant='body2' className='mb-2'>
                Inventory Type
              </Typography>
              <RadioGroup
                row
                value={inventoryType}
                onChange={e => {
                  setInventoryType(e.target.value as 'product' | 'raw_material')
                  setSelectedItem(null)
                }}
              >
                <FormControlLabel value='product' control={<Radio />} label='Product' />
                <FormControlLabel value='raw_material' control={<Radio />} label='Raw Material' />
              </RadioGroup>
            </FormControl>

            <Autocomplete
              options={inventoryItems}
              getOptionLabel={option => `${option.name} (${option.code})`}
              value={selectedItem}
              onChange={(_, value) => setSelectedItem(value)}
              loading={loadingItems}
              renderInput={params => (
                <TextField
                  {...params}
                  label={inventoryType === 'product' ? 'Select Product' : 'Select Raw Material'}
                  required
                />
              )}
              renderOption={(props, option) => (
                <Box component='li' {...props} key={option.id}>
                  <Box>
                    <Typography variant='body2'>{option.name}</Typography>
                    <Typography variant='caption' color='textSecondary'>
                      {option.code} - Current: {option.quantity} {option.unit}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            <FormControl>
              <Typography variant='body2' className='mb-2'>
                Adjustment Type
              </Typography>
              <RadioGroup
                row
                value={adjustmentType}
                onChange={e => setAdjustmentType(e.target.value as 'add' | 'subtract')}
              >
                <FormControlLabel
                  value='add'
                  control={<Radio color='success' />}
                  label='Add Stock'
                />
                <FormControlLabel
                  value='subtract'
                  control={<Radio color='error' />}
                  label='Remove Stock'
                />
              </RadioGroup>
            </FormControl>

            <TextField
              label='Quantity'
              type='number'
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              required
              InputProps={{
                endAdornment: selectedItem ? (
                  <InputAdornment position='end'>{selectedItem.unit}</InputAdornment>
                ) : null
              }}
            />

            <TextField
              label='Reason'
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              multiline
              rows={3}
              placeholder='Enter the reason for this adjustment...'
            />

            {selectedItem && quantity && (
              <Alert severity='info'>
                This will {adjustmentType === 'add' ? 'increase' : 'decrease'} the stock of{' '}
                <strong>{selectedItem.name}</strong> from{' '}
                <strong>
                  {selectedItem.quantity} {selectedItem.unit}
                </strong>{' '}
                to{' '}
                <strong>
                  {adjustmentType === 'add'
                    ? selectedItem.quantity + parseFloat(quantity || '0')
                    : selectedItem.quantity - parseFloat(quantity || '0')}{' '}
                  {selectedItem.unit}
                </strong>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color={adjustmentType === 'add' ? 'success' : 'error'}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
