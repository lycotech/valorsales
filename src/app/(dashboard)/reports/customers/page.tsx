'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import { Card, CardContent, Typography, Grid, TextField, Box, Button, IconButton } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridPaginationModel, GridSortModel, GridColDef } from '@mui/x-data-grid'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'

import { exportToExcel, exportReportToPDF, printPage } from '@/utils/exportHelpers'

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
  const isMounted = useRef(false)
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

      if (!isMounted.current) return

      if (result.success) {
        setCustomers(result.data)
        setSummary(result.summary)
      } else {
        console.error('Failed to fetch report:', result.error)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [search, location, sortBy, sortOrder])

  useEffect(() => {
    isMounted.current = true
    fetchReport()

    return () => {
      isMounted.current = false
    }
  }, [fetchReport])

  const handleSortModelChange = (model: GridSortModel) => {
    if (model.length > 0) {
      setSortBy(model[0].field)
      setSortOrder(model[0].sort || 'asc')
    }
  }

  const handleExportExcel = () => {
    exportToExcel(customers, {
      filename: `customers-report-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Customers',
      title: 'Customer List Report',
      columns: [
        { key: 'customerCode', label: 'Customer Code', width: 15 },
        { key: 'businessName', label: 'Business Name', width: 30 },
        { key: 'contactPerson', label: 'Contact Person', width: 20 },
        { key: 'phone', label: 'Phone', width: 15 },
        { key: 'location', label: 'Location', width: 20 },
        { key: 'totalTransactions', label: 'Transactions', width: 15 },
        { key: 'totalSales', label: 'Total Sales (₦)', width: 18 },
        { key: 'totalOutstanding', label: 'Outstanding (₦)', width: 18 }
      ]
    })
  }

  const handleExportPDF = () => {
    exportReportToPDF({
      filename: `customers-report-${new Date().toISOString().split('T')[0]}`,
      title: 'Customer List Report',
      subtitle: `Generated: ${new Date().toLocaleDateString()}`,
      orientation: 'landscape',
      sections: [
        {
          title: 'Summary',
          type: 'summary',
          summaryItems: [
            { label: 'Total Customers', value: summary.totalCustomers },
            { label: 'Total Transactions', value: summary.totalTransactions },
            { label: 'Total Sales', value: `₦${summary.totalSales.toLocaleString()}` },
            { label: 'Total Outstanding', value: `₦${summary.totalOutstanding.toLocaleString()}` }
          ]
        },
        {
          title: 'Customer Details',
          type: 'table',
          data: customers,
          columns: [
            { key: 'customerCode', label: 'Code' },
            { key: 'businessName', label: 'Business Name' },
            { key: 'contactPerson', label: 'Contact' },
            { key: 'phone', label: 'Phone' },
            { key: 'location', label: 'Location' },
            { key: 'totalTransactions', label: 'Trans.' },
            { key: 'totalSales', label: 'Sales (₦)', format: v => `₦${Number(v).toLocaleString()}` },
            { key: 'totalOutstanding', label: 'Outstanding (₦)', format: v => `₦${Number(v).toLocaleString()}` }
          ]
        }
      ]
    })
  }

  const handlePrint = () => {
    printPage()
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
      valueFormatter: value => `₦${(value as number)?.toLocaleString() || 0}`
    },
    {
      field: 'totalOutstanding',
      headerName: 'Outstanding',
      width: 140,
      type: 'number',
      sortable: false,
      valueFormatter: value => `₦${(value as number)?.toLocaleString() || 0}`,
      cellClassName: params => (params.value > 0 ? 'text-error' : 'text-success')
    },
    {
      field: 'createdAt',
      headerName: 'Registered',
      width: 120,
      sortable: true,
      valueFormatter: value => new Date(value).toLocaleDateString()
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
          <Button variant='outlined' startIcon={<DownloadIcon />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button variant='outlined' startIcon={<PictureAsPdfIcon />} onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant='outlined' startIcon={<PrintIcon />} onClick={handlePrint}>
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
