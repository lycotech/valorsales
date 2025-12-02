'use client'

/**
 * Purchases List Page
 * Display all purchase transactions with search and filters
 */

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  IconButton,
  Typography
} from '@mui/material'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'

interface Purchase {
  id: string
  supplier: {
    supplierCode: string
    name: string
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
}

export default function PurchasesPage() {
  const router = useRouter()

  // State
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Pagination
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10
  })

  const [rowCount, setRowCount] = useState(0)

  // Fetch purchases

  const fetchPurchases = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString()
      })

      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/purchases?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch purchases')
      }

      if (result.success) {
        setPurchases(result.data)
        setRowCount(result.pagination.total)
      } else {
        throw new Error(result.error || 'Failed to fetch purchases')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching purchases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, search, statusFilter])

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
  const columns: GridColDef<Purchase>[] = [
    {
      field: 'purchaseDate',
      headerName: 'Date',
      width: 120,
      valueFormatter: params =>
        new Date(params).toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
    },
    {
      field: 'supplier',
      headerName: 'Supplier',
      width: 200,
      valueGetter: (_, row) => `${row.supplier.supplierCode} - ${row.supplier.name}`
    },
    {
      field: 'rawMaterial',
      headerName: 'Raw Material',
      width: 200,
      valueGetter: (_, row) => `${row.rawMaterial.materialCode} - ${row.rawMaterial.materialName}`
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 100,
      type: 'number',
      valueFormatter: params => Number(params).toFixed(2)
    },
    {
      field: 'totalAmount',
      headerName: 'Total Amount',
      width: 150,
      type: 'number',
      valueFormatter: params =>
        `₦${Number(params).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      field: 'amountPaid',
      headerName: 'Amount Paid',
      width: 150,
      type: 'number',
      valueFormatter: params =>
        `₦${Number(params).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      field: 'balance',
      headerName: 'Balance',
      width: 150,
      type: 'number',
      renderCell: params => (
        <Typography variant='body2' color={params.value > 0 ? 'error.main' : 'success.main'} fontWeight={500}>
          ₦
          {Number(params.value).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
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
        <Box display='flex' gap={1}>
          <IconButton
            size='small'
            color='primary'
            onClick={() => router.push(`/purchases/${params.row.id}`)}
            title='View Details'
          >
            <i className='ri-eye-line' />
          </IconButton>
          <IconButton
            size='small'
            color='secondary'
            onClick={() => router.push(`/purchases/${params.row.id}/edit`)}
            title='Edit'
          >
            <i className='ri-edit-line' />
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
            Purchases
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage raw material purchase transactions
          </Typography>
        </Box>
        <Button variant='contained' onClick={() => router.push('/purchases/new')}>
          <i className='ri-add-line' />
          <Box component='span' sx={{ ml: 1 }}>
            New Purchase
          </Box>
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
          title='All Purchases'
          subheader={`${rowCount} total purchase(s)`}
          action={
            <Box display='flex' gap={2}>
              <TextField
                size='small'
                placeholder='Search...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Box component='i' className='ri-search-line' sx={{ mr: 1 }} />
                  )
                }}
                sx={{ minWidth: 250 }}
              />
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label='Status'>
                  <MenuItem value=''>All</MenuItem>
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
            rows={purchases}
            columns={columns}
            loading={loading}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            paginationMode='server'
            disableRowSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none'
              }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
