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
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material'

type ProductInventory = {
  id: string
  productId: string
  productCode: string
  productName: string
  price: number | null
  quantity: number
  minimumStock: number
  maximumStock: number | null
  reorderPoint: number
  unit: string
  lastRestockedAt: string | null
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'
}

type PaginationInfo = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export default function ProductInventoryPage() {
  const [inventory, setInventory] = useState<ProductInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  })

  const fetchInventory = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/inventory/products?${params}`)

      if (response.ok) {
        const data = await response.json()

        setInventory(data.data || [])
        setPagination(prev => ({
          ...prev,
          totalCount: data.pagination?.totalCount || 0,
          totalPages: data.pagination?.totalPages || 0
        }))
      }
    } catch (error) {
      console.error('Failed to fetch product inventory:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, search, statusFilter])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }))
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({ ...prev, pageSize: parseInt(event.target.value, 10), page: 1 }))
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Chip label='In Stock' color='success' size='small' />
      case 'low_stock':
        return <Chip label='Low Stock' color='warning' size='small' />
      case 'out_of_stock':
        return <Chip label='Out of Stock' color='error' size='small' />
      case 'overstock':
        return <Chip label='Overstock' color='info' size='small' />
      default:
        return <Chip label={status} size='small' />
    }
  }

  const getStockProgress = (item: ProductInventory) => {
    if (!item.maximumStock) return 50
    const percentage = (item.quantity / item.maximumStock) * 100

    return Math.min(percentage, 100)
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'success'
      case 'low_stock':
        return 'warning'
      case 'out_of_stock':
        return 'error'
      case 'overstock':
        return 'info'
      default:
        return 'primary'
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold'>
            Product Inventory
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Manage and monitor product stock levels
          </Typography>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <Box className='flex gap-4 flex-wrap'>
            <TextField
              label='Search Products'
              placeholder='Search by name or code...'
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              size='small'
              className='min-w-[250px]'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size='small' className='min-w-[150px]'>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label='Status'
                onChange={e => {
                  setStatusFilter(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
              >
                <MenuItem value='all'>All Status</MenuItem>
                <MenuItem value='in_stock'>In Stock</MenuItem>
                <MenuItem value='low_stock'>Low Stock</MenuItem>
                <MenuItem value='out_of_stock'>Out of Stock</MenuItem>
                <MenuItem value='overstock'>Overstock</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title='Refresh'>
              <IconButton onClick={fetchInventory} color='primary'>
                <i className='ri-refresh-line' />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Code</TableCell>
                <TableCell align='right'>Quantity</TableCell>
                <TableCell align='right'>Min Stock</TableCell>
                <TableCell align='right'>Reorder Point</TableCell>
                <TableCell>Stock Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Restocked</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={8} align='center'>
                    <Typography color='textSecondary' className='py-8'>
                      No inventory records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant='body2' className='font-medium'>
                        {item.productName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='textSecondary'>
                        {item.productCode}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' className='font-semibold'>
                        {item.quantity} {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2'>{item.minimumStock}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2'>{item.reorderPoint}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box className='w-24'>
                        <LinearProgress
                          variant='determinate'
                          value={getStockProgress(item)}
                          color={getProgressColor(item.status) as any}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{getStatusChip(item.status)}</TableCell>
                    <TableCell>
                      <Typography variant='body2' color='textSecondary'>
                        {item.lastRestockedAt
                          ? new Date(item.lastRestockedAt).toLocaleDateString()
                          : 'Never'}
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
    </div>
  )
}
