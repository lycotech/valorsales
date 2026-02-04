'use client'

/**
 * Product Replacements Page
 * Displays all product replacements with filtering
 */

import { useState, useEffect, useCallback } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import type { ProductReplacement, Sale, Product, Customer } from '@prisma/client'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

type ReplacementWithDetails = ProductReplacement & {
  sale: Sale & {
    customer: Customer
  }
  product: Product
  quantity: number
}

type ReplacementListResponse = {
  success: boolean
  data: ReplacementWithDetails[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  error?: string
  message?: string
}

const REASONS = [
  { value: '', label: 'All Reasons' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'defective', label: 'Defective' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' }
]

const ProductReplacementsPage = () => {
  // State
  const [replacements, setReplacements] = useState<ReplacementWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10
  })

  const [rowCount, setRowCount] = useState(0)

  // Filter state
  const [filterReason, setFilterReason] = useState('')
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null)
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null)

  // Fetch replacements
  useEffect(() => {
    const fetchReplacements = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          page: (paginationModel.page + 1).toString(),
          pageSize: paginationModel.pageSize.toString(),
          ...(filterReason && { reason: filterReason }),
          ...(filterStartDate && { startDate: filterStartDate.toISOString() }),
          ...(filterEndDate && { endDate: filterEndDate.toISOString() })
        })

        const response = await fetch(`/api/inventory/replacements?${params}`)
        const data: ReplacementListResponse = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch replacements')
        }

        setReplacements(data.data)
        setRowCount(data.pagination.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching replacements:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReplacements()
  }, [paginationModel.page, paginationModel.pageSize, filterReason, filterStartDate, filterEndDate])

  // DataGrid columns
  const columns: GridColDef<ReplacementWithDetails>[] = [
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 120,
      renderCell: params => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'sale',
      headerName: 'Sale Code',
      width: 130,
      renderCell: params => params.value?.saleCode || '-'
    },
    {
      field: 'customer',
      headerName: 'Customer',
      flex: 1,
      minWidth: 180,
      renderCell: params => params.row.sale?.customer?.businessName || '-'
    },
    {
      field: 'product',
      headerName: 'Product',
      flex: 1,
      minWidth: 180,
      renderCell: params => params.value?.productName || '-'
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 100,
      renderCell: params => params.value.toLocaleString()
    },
    {
      field: 'reason',
      headerName: 'Reason',
      width: 120,
      renderCell: params => params.value.charAt(0).toUpperCase() + params.value.slice(1)
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1,
      minWidth: 200,
      renderCell: params => params.value || '-'
    }
  ]

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className='flex flex-col gap-6'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold'>Product Replacements</h1>
            <p className='text-textSecondary'>Track damaged/defective product replacements</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader title='Filters' />
          <div className='p-4 flex gap-4 flex-wrap'>
            <TextField
              select
              label='Reason'
              value={filterReason}
              onChange={e => {
                setFilterReason(e.target.value)
                setPaginationModel(prev => ({ ...prev, page: 0 }))
              }}
              sx={{ minWidth: 200 }}
              size='small'
            >
              {REASONS.map(reason => (
                <MenuItem key={reason.value} value={reason.value}>
                  {reason.label}
                </MenuItem>
              ))}
            </TextField>
            <DatePicker
              label='Start Date'
              value={filterStartDate}
              onChange={date => {
                setFilterStartDate(date)
                setPaginationModel(prev => ({ ...prev, page: 0 }))
              }}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
            />
            <DatePicker
              label='End Date'
              value={filterEndDate}
              onChange={date => {
                setFilterEndDate(date)
                setPaginationModel(prev => ({ ...prev, page: 0 }))
              }}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
            />
            <Button
              variant='outlined'
              onClick={() => {
                setFilterReason('')
                setFilterStartDate(null)
                setFilterEndDate(null)
                setPaginationModel(prev => ({ ...prev, page: 0 }))
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Data Grid Card */}
        <Card>
          <CardHeader title='All Replacements' />
          <DataGrid
            rows={replacements}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            rowCount={rowCount}
            paginationMode='server'
            loading={loading}
            disableRowSelectionOnClick
            disableColumnMenu
            autoHeight
            sx={{ '& .MuiDataGrid-root': { border: 'none' } }}
          />
        </Card>
      </div>
    </LocalizationProvider>
  )
}

export default ProductReplacementsPage
