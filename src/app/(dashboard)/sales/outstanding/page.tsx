'use client'

/**
 * Customer Outstanding Balances Page
 * Report showing customer-wise outstanding balances
 */

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  Typography,
  Grid,
  Alert,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface Sale {
  id: string
  supplyDate: string
  productId: string
  quantity: number
  price: number
  total: number
  amountPaid: number
  balance: number
  status: string
  paymentMode: string
}

interface CustomerOutstanding {
  customerId: string
  customerCode: string
  customerName: string
  phone: string
  location: string
  totalSales: number
  totalAmount: number
  totalPaid: number
  totalOutstanding: number
  salesCount: number
  sales: Sale[]
}

interface Summary {
  totalCustomers: number
  totalSales: number
  totalAmount: number
  totalPaid: number
  totalOutstanding: number
}

export default function CustomerOutstandingPage() {
  const router = useRouter()

  // State
  const [data, setData] = useState<CustomerOutstanding[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Expanded accordion
  const [expanded, setExpanded] = useState<string | false>(false)

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (startDate) params.append('startDate', startDate.toISOString().split('T')[0])
      if (endDate) params.append('endDate', endDate.toISOString().split('T')[0])

      const response = await fetch(`/api/reports/customer-outstanding?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      if (result.success) {
        setData(result.data)
        setSummary(result.summary)
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching customer outstanding:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, startDate, endDate])

  // Handle accordion expand
  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
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

  // DataGrid columns for summary
  const summaryColumns: GridColDef<CustomerOutstanding>[] = [
    {
      field: 'customerCode',
      headerName: 'Code',
      width: 120
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      width: 250
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150
    },
    {
      field: 'salesCount',
      headerName: 'Sales Count',
      width: 120,
      type: 'number'
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
      field: 'totalPaid',
      headerName: 'Total Paid',
      width: 150,
      type: 'number',
      valueFormatter: params =>
        `₦${Number(params).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      field: 'totalOutstanding',
      headerName: 'Outstanding',
      width: 150,
      type: 'number',
      renderCell: params => (
        <Typography variant='body2' color='error.main' fontWeight={600}>
          ₦
          {Number(params.value).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: params => (
        <IconButton
          size='small'
          color='primary'
          onClick={() => {
            const panel = `panel-${params.row.customerId}`

            setExpanded(expanded === panel ? false : panel)
          }}
          title='View Details'
        >
          <i className='ri-arrow-down-s-line' />
        </IconButton>
      )
    }
  ]

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box mb={4} display='flex' justifyContent='space-between' alignItems='center'>
          <Box>
            <Typography variant='h4' gutterBottom>
              Customer Outstanding Balances
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Track outstanding receivables from customers
            </Typography>
          </Box>
          <Button variant='outlined' onClick={() => router.push('/sales')}>
            Back to Sales
          </Button>
        </Box>

        {error && (
          <Box mb={3}>
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Total Customers
                  </Typography>
                  <Typography variant='h4' fontWeight={600}>
                    {summary.totalCustomers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Total Sales
                  </Typography>
                  <Typography variant='h4' fontWeight={600}>
                    {summary.totalSales}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Total Amount
                  </Typography>
                  <Typography variant='h5' fontWeight={600}>
                    ₦
                    {summary.totalAmount.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Total Outstanding
                  </Typography>
                  <Typography variant='h5' fontWeight={600} color='error.main'>
                    ₦
                    {summary.totalOutstanding.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title='Filters' />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label='Status'>
                    <MenuItem value='all'>All Outstanding</MenuItem>
                    <MenuItem value='partial'>Partial</MenuItem>
                    <MenuItem value='pending'>Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <DatePicker
                  label='Start Date'
                  value={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <DatePicker
                  label='End Date'
                  value={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Customer Outstanding List */}
        <Card>
          <CardHeader title='Customer Outstanding Summary' subheader={`${data.length} customer(s) with outstanding balances`} />
          <CardContent>
            {data.length > 0 ? (
              <Box>
                {/* Summary Table */}
                <DataGrid
                  rows={data}
                  columns={summaryColumns}
                  getRowId={row => row.customerId}
                  autoHeight
                  disableRowSelectionOnClick
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 10 }
                    },
                    sorting: {
                      sortModel: [{ field: 'totalOutstanding', sort: 'desc' }]
                    }
                  }}
                  pageSizeOptions={[10, 25, 50]}
                />

                {/* Expandable Details */}
                <Box mt={3}>
                  <Typography variant='h6' gutterBottom>
                    Transaction Details
                  </Typography>
                  {data.map(customer => (
                    <Accordion
                      key={customer.customerId}
                      expanded={expanded === `panel-${customer.customerId}`}
                      onChange={handleAccordionChange(`panel-${customer.customerId}`)}
                    >
                      <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                        <Box display='flex' justifyContent='space-between' width='100%' alignItems='center'>
                          <Box>
                            <Typography variant='body1' fontWeight={500}>
                              {customer.customerCode} - {customer.customerName}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {customer.salesCount} sale(s) • {customer.location}
                            </Typography>
                          </Box>
                          <Typography variant='h6' color='error.main' fontWeight={600} sx={{ mr: 2 }}>
                            ₦
                            {customer.totalOutstanding.toLocaleString('en-NG', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer component={Paper} variant='outlined'>
                          <Table size='small'>
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Qty</TableCell>
                                <TableCell>Unit Price</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Paid</TableCell>
                                <TableCell>Balance</TableCell>
                                <TableCell>Payment Mode</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {customer.sales.map(sale => (
                                <TableRow key={sale.id}>
                                  <TableCell>
                                    {new Date(sale.supplyDate).toLocaleDateString('en-NG', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </TableCell>
                                  <TableCell>{sale.quantity.toFixed(2)}</TableCell>
                                  <TableCell>
                                    ₦
                                    {sale.price.toLocaleString('en-NG', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    ₦
                                    {sale.total.toLocaleString('en-NG', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    ₦
                                    {sale.amountPaid.toLocaleString('en-NG', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    <Typography fontWeight={600} color='error.main'>
                                      ₦
                                      {sale.balance.toLocaleString('en-NG', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ textTransform: 'capitalize' }}>{sale.paymentMode}</TableCell>
                                  <TableCell>
                                    <Chip label={sale.status} size='small' color={getStatusColor(sale.status)} />
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      size='small'
                                      color='primary'
                                      onClick={() => router.push(`/sales/${sale.id}`)}
                                      title='View Sale'
                                    >
                                      <i className='ri-eye-line' />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Box mt={2} display='flex' justifyContent='flex-end'>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant='body2' color='text.secondary'>
                              Total Outstanding for {customer.customerName}
                            </Typography>
                            <Typography variant='h6' color='error.main' fontWeight={600}>
                              ₦
                              {customer.totalOutstanding.toLocaleString('en-NG', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </Box>
            ) : (
              <Alert severity='info'>No outstanding balances found</Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  )
}
