'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import { Card, CardContent, Typography, Grid, TextField, MenuItem, Box, Button, IconButton } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridPaginationModel, GridColDef } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'

import { exportToExcel, exportReportToPDF, printPage } from '@/utils/exportHelpers'

interface ProductSalesData {
  productId: string
  productCode: string
  productName: string
  totalQuantitySold: number
  totalSales: number
  totalRevenue: number
  totalOutstanding: number
  salesCount: number
}

interface ReportSummary {
  totalProducts: number
  totalTransactions: number
  totalQuantitySold: number
  totalRevenue: number
  totalOutstanding: number
}

export default function SalesByProductPage() {
  const isMounted = useRef(false)
  const [products, setProducts] = useState<ProductSalesData[]>([])

  const [summary, setSummary] = useState<ReportSummary>({
    totalProducts: 0,
    totalTransactions: 0,
    totalQuantitySold: 0,
    totalRevenue: 0,
    totalOutstanding: 0
  })

  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [sortBy, setSortBy] = useState('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25
  })

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        sortBy,
        sortOrder
      })

      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await fetch(`/api/reports/sales-by-product?${params}`)
      const result = await response.json()

      if (!isMounted.current) return

      if (result.success) {
        setProducts(result.data)
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
  }, [startDate, endDate, sortBy, sortOrder])

  useEffect(() => {
    isMounted.current = true
    fetchReport()

    return () => {
      isMounted.current = false
    }
  }, [fetchReport])

  const handleExportExcel = () => {
    exportToExcel(products, {
      filename: `sales-by-product-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Sales by Product',
      title: 'Sales by Product Report',
      subtitle: `Period: ${startDate?.toLocaleDateString() || 'All Time'} - ${endDate?.toLocaleDateString() || 'Present'}`,
      columns: [
        { key: 'productCode', label: 'Product Code', width: 15 },
        { key: 'productName', label: 'Product Name', width: 30 },
        { key: 'salesCount', label: 'Transactions', width: 15 },
        { key: 'totalQuantitySold', label: 'Qty Sold', width: 15 },
        { key: 'totalRevenue', label: 'Revenue (₦)', width: 18 },
        { key: 'totalOutstanding', label: 'Outstanding (₦)', width: 18 }
      ]
    })
  }

  const handleExportPDF = () => {
    exportReportToPDF({
      filename: `sales-by-product-${new Date().toISOString().split('T')[0]}`,
      title: 'Sales by Product Report',
      subtitle: `Period: ${startDate?.toLocaleDateString() || 'All Time'} - ${endDate?.toLocaleDateString() || 'Present'}`,
      orientation: 'landscape',
      sections: [
        {
          title: 'Summary',
          type: 'summary',
          summaryItems: [
            { label: 'Total Products', value: summary.totalProducts || 0 },
            { label: 'Total Transactions', value: summary.totalTransactions || 0 },
            { label: 'Total Quantity Sold', value: (summary.totalQuantitySold || 0).toLocaleString() },
            { label: 'Total Revenue', value: `₦${(summary.totalRevenue || 0).toLocaleString()}` },
            { label: 'Total Outstanding', value: `₦${(summary.totalOutstanding || 0).toLocaleString()}` }
          ]
        },
        {
          title: 'Product Sales Details',
          type: 'table',
          data: products,
          columns: [
            { key: 'productCode', label: 'Code' },
            { key: 'productName', label: 'Product' },
            { key: 'salesCount', label: 'Trans.' },
            { key: 'totalQuantitySold', label: 'Qty Sold' },
            { key: 'totalRevenue', label: 'Revenue (₦)', format: v => `₦${Number(v).toLocaleString()}` },
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
      field: 'productCode',
      headerName: 'Product Code',
      width: 130
    },
    {
      field: 'productName',
      headerName: 'Product Name',
      width: 250
    },
    {
      field: 'salesCount',
      headerName: 'Transactions',
      width: 120,
      type: 'number'
    },
    {
      field: 'totalQuantitySold',
      headerName: 'Quantity Sold',
      width: 140,
      type: 'number'
    },
    {
      field: 'totalRevenue',
      headerName: 'Total Revenue',
      width: 160,
      type: 'number',
      valueFormatter: value => `₦${(value as number)?.toLocaleString() || 0}`,
      cellClassName: () => 'text-success'
    },
    {
      field: 'totalOutstanding',
      headerName: 'Outstanding',
      width: 150,
      type: 'number',
      valueFormatter: value => `₦${(value as number)?.toLocaleString() || 0}`,
      cellClassName: params => (params.value > 0 ? 'text-error' : 'text-success')
    },
    {
      field: 'averagePrice',
      headerName: 'Avg Price',
      width: 130,
      type: 'number',
      valueGetter: (value, row) =>
        ((row.totalQuantitySold || 0) > 0 ? (row.totalRevenue || 0) / row.totalQuantitySold : 0).toFixed(2),
      valueFormatter: value => `₦${parseFloat(value || '0').toLocaleString()}`
    }
  ]

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
          <Typography variant='h4'>Sales by Product Report</Typography>
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
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Total Products
                </Typography>
                <Typography variant='h4'>{summary.totalProducts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Transactions
                </Typography>
                <Typography variant='h4'>{summary.totalTransactions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Quantity Sold
                </Typography>
                <Typography variant='h4'>{(summary.totalQuantitySold || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Total Revenue
                </Typography>
                <Typography color='success.main' variant='h4'>
                  ₦{(summary.totalRevenue || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Outstanding
                </Typography>
                <Typography color='error' variant='h4'>
                  ₦{(summary.totalOutstanding || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label='Start Date'
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label='End Date'
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label='Sort By' value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <MenuItem value='revenue'>Revenue</MenuItem>
                  <MenuItem value='quantity'>Quantity Sold</MenuItem>
                  <MenuItem value='sales'>Number of Sales</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label='Sort Order'
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                >
                  <MenuItem value='desc'>Highest First</MenuItem>
                  <MenuItem value='asc'>Lowest First</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Data Grid */}
        <Card>
          <DataGrid
            rows={products}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            getRowId={row => row.productId}
            autoHeight
            sx={{
              '& .text-error': {
                color: 'error.main',
                fontWeight: 600
              },
              '& .text-success': {
                color: 'success.main',
                fontWeight: 600
              }
            }}
          />
        </Card>
      </Box>
    </LocalizationProvider>
  )
}
