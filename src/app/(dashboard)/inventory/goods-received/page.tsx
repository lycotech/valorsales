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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Tooltip
} from '@mui/material'

type InventoryItem = {
  id: string
  code: string
  name: string
  currentStock: number
  unit: string
}

type GoodsReceivedRecord = {
  id: string
  type: 'product' | 'raw_material'
  itemCode: string
  itemName: string
  quantityReceived: number
  quantityBefore: number
  quantityAfter: number
  referenceNumber: string | null
  notes: string | null
  receivedAt: string
}

type PaginationInfo = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export default function GoodsReceivedPage() {
  const [records, setRecords] = useState<GoodsReceivedRecord[]>([])
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
  const [itemType, setItemType] = useState<'product' | 'raw_material'>('product')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [quantity, setQuantity] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString()
      })

      const response = await fetch(`/api/inventory/goods-received?${params}`)

      if (response.ok) {
        const data = await response.json()

        setRecords(data.data || [])
        setPagination(prev => ({
          ...prev,
          totalCount: data.pagination?.totalCount || 0,
          totalPages: data.pagination?.totalPages || 0
        }))
      }
    } catch (error) {
      console.error('Failed to fetch goods received:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize])

  const fetchInventoryItems = useCallback(async () => {
    setLoadingItems(true)

    try {
      const endpoint =
        itemType === 'product' ? '/api/inventory/products' : '/api/inventory/raw-materials'

      const response = await fetch(`${endpoint}?pageSize=100`)

      if (response.ok) {
        const data = await response.json()

        const items: InventoryItem[] = (data.data || []).map((item: any) => ({
          id: itemType === 'product' ? item.productId : item.rawMaterialId,
          code: itemType === 'product' ? item.productCode : item.materialCode,
          name: itemType === 'product' ? item.productName : item.materialName,
          currentStock: item.quantity,
          unit: item.unit
        }))

        setInventoryItems(items)
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error)
    } finally {
      setLoadingItems(false)
    }
  }, [itemType])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  useEffect(() => {
    if (dialogOpen) {
      fetchInventoryItems()
    }
  }, [dialogOpen, fetchInventoryItems])

  const handleOpenDialog = () => {
    setDialogOpen(true)
    setError(null)
    setSuccess(null)
    setSelectedItem(null)
    setQuantity('')
    setReferenceNumber('')
    setNotes('')
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setError(null)
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

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/inventory/goods-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          itemId: selectedItem.id,
          quantity: parseFloat(quantity),
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Successfully received ${quantity} ${selectedItem.unit} of ${selectedItem.name}`)
        handleCloseDialog()
        fetchRecords()
        fetchInventoryItems()
      } else {
        setError(result.message || result.error || 'Failed to record goods received')
      }
    } catch (err) {
      setError('An error occurred while recording goods received')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }))
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({ ...prev, pageSize: parseInt(event.target.value, 10), page: 1 }))
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold'>
            Goods Received
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Record incoming stock for products and raw materials
          </Typography>
        </div>
        <Button variant='contained' color='primary' onClick={handleOpenDialog} startIcon={<i className='ri-add-line' />}>
          Receive Goods
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <Alert severity='success' onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Recent Goods Received Table */}
      <Card>
        <CardContent>
          <Box className='flex justify-between items-center mb-4'>
            <Typography variant='h6'>Recent Goods Received</Typography>
            <Tooltip title='Refresh'>
              <IconButton onClick={fetchRecords} color='primary'>
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
                <TableCell>Type</TableCell>
                <TableCell>Item</TableCell>
                <TableCell align='right'>Qty Received</TableCell>
                <TableCell align='right'>Before</TableCell>
                <TableCell align='right'>After</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={8} align='center'>
                    <Typography color='textSecondary' className='py-8'>
                      No goods received records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map(record => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography variant='body2'>
                        {new Date(record.receivedAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        {new Date(record.receivedAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.type === 'product' ? 'Product' : 'Raw Material'}
                        size='small'
                        color={record.type === 'product' ? 'primary' : 'secondary'}
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' className='font-medium'>
                        {record.itemName}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        {record.itemCode}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' className='font-semibold text-green-600'>
                        +{record.quantityReceived}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' color='textSecondary'>
                        {record.quantityBefore}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' className='font-medium'>
                        {record.quantityAfter}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {record.referenceNumber || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='textSecondary' className='max-w-[200px] truncate'>
                        {record.notes || '-'}
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

      {/* Receive Goods Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Receive Goods</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 mt-2'>
            {error && (
              <Alert severity='error' onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>Item Type</InputLabel>
              <Select
                value={itemType}
                label='Item Type'
                onChange={e => {
                  setItemType(e.target.value as 'product' | 'raw_material')
                  setSelectedItem(null)
                }}
              >
                <MenuItem value='product'>Product</MenuItem>
                <MenuItem value='raw_material'>Raw Material</MenuItem>
              </Select>
            </FormControl>

            <Autocomplete
              options={inventoryItems}
              loading={loadingItems}
              value={selectedItem}
              onChange={(_, newValue) => setSelectedItem(newValue)}
              getOptionLabel={option => `${option.code} - ${option.name}`}
              renderInput={params => (
                <TextField
                  {...params}
                  label={itemType === 'product' ? 'Select Product' : 'Select Raw Material'}
                  required
                />
              )}
              renderOption={(props, option) => (
                <Box component='li' {...props} key={option.id}>
                  <Box>
                    <Typography variant='body2'>{option.name}</Typography>
                    <Typography variant='caption' color='textSecondary'>
                      {option.code} - Current Stock: {option.currentStock} {option.unit}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            <TextField
              label='Quantity to Receive'
              type='number'
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              required
              inputProps={{ min: 0.01, step: 0.01 }}
              helperText={selectedItem ? `Unit: ${selectedItem.unit}` : ''}
            />

            <TextField
              label='Reference Number (Optional)'
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder='e.g., PO-2024-001, Invoice #12345'
            />

            <TextField
              label='Notes (Optional)'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              multiline
              rows={2}
              placeholder='Add any additional notes...'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant='contained' disabled={submitting || !selectedItem || !quantity}>
            {submitting ? 'Receiving...' : 'Receive Goods'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
