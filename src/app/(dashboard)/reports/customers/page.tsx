'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Box,
  Button,
  IconButton
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridPaginationModel, GridSortModel, GridColDef } from '@mui/x-data-grid'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'

interface CustomerReportData {
  id: string
  customerCode: string
  businessName: string
  contactPerson: string
  phone: string
  location: string
  createdAt: string
  totalTransactions: number
  totalSales: number
  totalOutstanding: number
}

interface ReportSummary {
  totalCustomers: number
  totalTransactions: number
  totalSales: number
  totalOutstanding: number
}

export default function CustomerReportPage() {
  const [customers, setCustomers] = useState<CustomerReportData[]>([])

  const [summary, setSummary] = useState<ReportSummary>({
    totalCustomers: 0,
    totalTransactions: 0,
    totalSales: 0,
    totalOutstanding: 0
  })

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25
  })

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        search,
        location,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/reports/customers?${params}`)
      const result = await response.json()

      if (result.success) {
        setCustomers(result.data)
        setSummary(result.summary)
      } else {
        console.error('Failed to fetch report:', result.error)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }, [search, location, sortBy, sortOrder])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleSortModelChange = (model: GridSortModel) => {
    if (model.length > 0) {
      setSortBy(model[0].field)
      setSortOrder(model[0].sort || 'asc')
    }
  }

  const handleExport = (format: 'csv' | 'excel') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`)
  }

  const handlePrint = () => {
    window.print()
  }

  const columns: GridColDef[] = [
    {
      field: 'customerCode',
      headerName: 'Customer Code',
      width: 130,
      sortable: true
    },
    {
      field: 'businessName',
      headerName: 'Business Name',
      width: 200,
      sortable: true
    },
    {
      field: 'contactPerson',
      headerName: 'Contact Person',
      width: 160,
      sortable: false
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
      sortable: false
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      sortable: true
    },
    {
      field: 'totalTransactions',
      headerName: 'Transactions',
      width: 120,
      type: 'number',
      sortable: false
    },
    {
      field: 'totalSales',
      headerName: 'Total Sales',
      width: 140,
      type: 'number',
      sortable: false,
      valueFormatter: (value) => `₦${(value as number)?.toLocaleString() || 0}`
    },
    {
      field: 'totalOutstanding',
      headerName: 'Outstanding',
      width: 140,
      type: 'number',
      sortable: false,
      valueFormatter: (value) => `₦${(value as number)?.toLocaleString() || 0}`,
      cellClassName: (params) => (params.value > 0 ? 'text-error' : 'text-success')
    },
    {
      field: 'createdAt',
      headerName: 'Registered',
      width: 120,
      sortable: true,
      valueFormatter: (value) => new Date(value).toLocaleDateString()
    }
  ]

  return (
    <Box>
      {/* Header */}
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
        <Typography variant='h4'>Customer Report</Typography>
        <Box display='flex' gap={1}>
          <IconButton onClick={fetchReport} title='Refresh'>
            <RefreshIcon />
          </IconButton>
          <Button
            variant='outlined'
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('excel')}
          >
            Export Excel
          </Button>
          <Button
            variant='outlined'
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='text.secondary' gutterBottom variant='body2'>
                Total Customers
              </Typography>
              <Typography variant='h4'>{summary.totalCustomers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='text.secondary' gutterBottom variant='body2'>
                Total Transactions
              </Typography>
              <Typography variant='h4'>{summary.totalTransactions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='text.secondary' gutterBottom variant='body2'>
                Total Sales
              </Typography>
              <Typography variant='h4'>₦{summary.totalSales.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='text.secondary' gutterBottom variant='body2'>
                Total Outstanding
              </Typography>
              <Typography color='error' variant='h4'>
                ₦{summary.totalOutstanding.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Search'
                placeholder='Search by code, business name, contact, or phone'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Location'
                placeholder='Filter by location'
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <DataGrid
          rows={customers}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          sortingMode='server'
          onSortModelChange={handleSortModelChange}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            '& .text-error': {
              color: 'error.main',
              fontWeight: 600
            },
            '& .text-success': {
              color: 'success.main'
            }
          }}
        />
      </Card>
    </Box>
  )
}
