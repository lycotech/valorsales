'use client'

/**
 * Sales List Page
 * View and manage all sales transactions
 */

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Alert
} from '@mui/material'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'

import type { Sale } from '@/types/salesTypes'
import type { Customer } from '@/types/customerTypes'
import type { Product } from '@/types/productTypes'

interface SaleWithRelations extends Sale {
  customer: Pick<Customer, 'id' | 'customerCode' | 'businessName'>
  product: Pick<Product, 'id' | 'productCode' | 'productName'>
  _count: {
    payments: number
  }
}

export default function SalesListPage() {
  const router = useRouter()

  // State
  const [sales, setSales] = useState<SaleWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25
  })

  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch sales
  const fetchSales = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(paginationModel.page + 1),
        pageSize: String(paginationModel.pageSize)
      })

      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/sales?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch sales')
      }

      if (result.success) {
        setSales(result.data)
        setTotalCount(result.pagination.totalCount)
      } else {
        throw new Error(result.error || 'Failed to fetch sales')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching sales:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch sales on mount and when filters change
  useEffect(() => {
    fetchSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, searchQuery, statusFilter])

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale?')) return

    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to delete sale')
      }

      if (result.success) {
        fetchSales() // Refresh list
      } else {
        throw new Error(result.error || 'Failed to delete sale')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete sale')
      console.error('Error deleting sale:', err)
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

  // DataGrid columns
  const columns: GridColDef<SaleWithRelations>[] = [
    {
      field: 'supplyDate',
      headerName: 'Date',
      width: 110,
      valueFormatter: params => new Date(params).toLocaleDateString()
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: 200,
      valueGetter: (_, row) => `${row.customer.customerCode} - ${row.customer.businessName}`
    },
    {
      field: 'product',
      headerName: 'Product',
      width: 200,
      valueGetter: (_, row) => `${row.product.productCode} - ${row.product.productName}`
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 80,
      type: 'number',
      valueFormatter: params => Number(params).toFixed(2)
    },
    {
      field: 'price',
      headerName: 'Unit Price',
      width: 120,
      type: 'number',
      valueFormatter: params =>
        `₦${Number(params).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 130,
      type: 'number',
      valueFormatter: params =>
        `₦${Number(params).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      field: 'amountPaid',
      headerName: 'Paid',
      width: 130,
      type: 'number',
      valueFormatter: params =>
        `₦${Number(params).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      field: 'balance',
      headerName: 'Balance',
      width: 130,
      type: 'number',
      renderCell: params => (
        <Typography
          variant='body2'
          color={Number(params.value) > 0 ? 'error.main' : 'success.main'}
          fontWeight={500}
        >
          ₦
          {Number(params.value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'paymentMode',
      headerName: 'Payment',
      width: 100,
      renderCell: params => (
        <Chip
          label={params.value}
          size='small'
          variant='outlined'
          sx={{ textTransform: 'capitalize' }}
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: params => (
        <Chip
          label={params.value}
          size='small'
          color={getStatusColor(params.value)}
          sx={{ textTransform: 'capitalize' }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size='small'
            color='primary'
            onClick={() => router.push(`/sales/${params.row.id}`)}
            title='View Details'
          >
            <i className='ri-eye-line' />
          </IconButton>
          <IconButton
            size='small'
            color='info'
            onClick={() => router.push(`/sales/${params.row.id}/edit`)}
            title='Edit'
          >
            <i className='ri-edit-line' />
          </IconButton>
          <IconButton
            size='small'
            color='error'
            onClick={() => handleDelete(params.row.id)}
            title='Delete'
          >
            <i className='ri-delete-bin-line' />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <Box>
      <Box mb={4} display='flex' justifyContent='space-between' alignItems='center'>
        <Box>
          <Typography variant='h4' gutterBottom>
            Sales Transactions
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage all sales transactions with customer, product, and payment details
          </Typography>
        </Box>
        <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={() => router.push('/sales/new')}>
          New Sale
        </Button>
      </Box>

      {error && (
        <Box mb={3}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      <Card>
        <CardHeader
          title='Sales List'
          action={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size='small'
                placeholder='Search customer or product...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <i className='ri-search-line' />
                }}
                sx={{ width: 300, '& .ri-search-line': { mr: 1 } }}
              />
              <FormControl size='small' sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label='Status'>
                  <MenuItem value='all'>All</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='partial'>Partial</MenuItem>
                  <MenuItem value='paid'>Paid</MenuItem>
                </Select>
              </FormControl>
            </Box>
          }
        />
        <CardContent>
          <DataGrid
            rows={sales}
            columns={columns}
            loading={loading}
            paginationMode='server'
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            rowCount={totalCount}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer'
              }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
