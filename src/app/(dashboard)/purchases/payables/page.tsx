'use client'

/**
 * Supplier Payables Page
 * Report showing supplier-wise outstanding payables
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

interface Purchase {
  id: string
  purchaseDate: string
  rawMaterialCode: string
  rawMaterialName: string
  quantity: number
  totalAmount: number
  amountPaid: number
  balance: number
  status: string
}

interface SupplierPayable {
  supplierId: string
  supplierCode: string
  supplierName: string
  phone: string
  location: string
  totalPurchases: number
  totalAmount: number
  totalPaid: number
  totalPayable: number
  purchasesCount: number
  purchases: Purchase[]
}

interface Summary {
  totalSuppliers: number
  totalPurchases: number
  totalAmount: number
  totalPaid: number
  totalPayable: number
}

export default function SupplierPayablesPage() {
  const router = useRouter()

  // State
  const [data, setData] = useState<SupplierPayable[]>([])
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

      const response = await fetch(`/api/reports/supplier-payables?${params.toString()}`)
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
      console.error('Error fetching supplier payables:', err)
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
  const summaryColumns: GridColDef<SupplierPayable>[] = [
    {
      field: 'supplierCode',
      headerName: 'Code',
      width: 120
    },
    {
      field: 'supplierName',
      headerName: 'Supplier',
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
      field: 'purchasesCount',
      headerName: 'Purchases',
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
      field: 'totalPayable',
      headerName: 'Payable',
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
            const panel = `panel-${params.row.supplierId}`

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
              Supplier Outstanding Payables
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Track outstanding payables to suppliers
            </Typography>
          </Box>
          <Button variant='outlined' onClick={() => router.push('/purchases')}>
            Back to Purchases
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
                    Total Suppliers
                  </Typography>
                  <Typography variant='h4' fontWeight={600}>
                    {summary.totalSuppliers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Total Purchases
                  </Typography>
                  <Typography variant='h4' fontWeight={600}>
                    {summary.totalPurchases}
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
                    Total Payable
                  </Typography>
                  <Typography variant='h5' fontWeight={600} color='error.main'>
                    ₦
                    {summary.totalPayable.toLocaleString('en-NG', {
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

        {/* Supplier Payables List */}
        <Card>
          <CardHeader
            title='Supplier Payables Summary'
            subheader={`${data.length} supplier(s) with outstanding payables`}
          />
          <CardContent>
            {data.length > 0 ? (
              <Box>
                {/* Summary Table */}
                <DataGrid
                  rows={data}
                  columns={summaryColumns}
                  getRowId={row => row.supplierId}
                  autoHeight
                  disableRowSelectionOnClick
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 10 }
                    },
                    sorting: {
                      sortModel: [{ field: 'totalPayable', sort: 'desc' }]
                    }
                  }}
                  pageSizeOptions={[10, 25, 50]}
                />

                {/* Expandable Details */}
                <Box mt={3}>
                  <Typography variant='h6' gutterBottom>
                    Transaction Details
                  </Typography>
                  {data.map(supplier => (
                    <Accordion
                      key={supplier.supplierId}
                      expanded={expanded === `panel-${supplier.supplierId}`}
                      onChange={handleAccordionChange(`panel-${supplier.supplierId}`)}
                    >
                      <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                        <Box display='flex' justifyContent='space-between' width='100%' alignItems='center'>
                          <Box>
                            <Typography variant='body1' fontWeight={500}>
                              {supplier.supplierCode} - {supplier.supplierName}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {supplier.purchasesCount} purchase(s) • {supplier.location}
                            </Typography>
                          </Box>
                          <Typography variant='h6' color='error.main' fontWeight={600} sx={{ mr: 2 }}>
                            ₦
                            {supplier.totalPayable.toLocaleString('en-NG', {
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
                                <TableCell>Raw Material</TableCell>
                                <TableCell>Qty</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Paid</TableCell>
                                <TableCell>Balance</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {supplier.purchases.map(purchase => (
                                <TableRow key={purchase.id}>
                                  <TableCell>
                                    {new Date(purchase.purchaseDate).toLocaleDateString('en-NG', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    {purchase.rawMaterialCode} - {purchase.rawMaterialName}
                                  </TableCell>
                                  <TableCell>{purchase.quantity.toFixed(2)}</TableCell>
                                  <TableCell>
                                    ₦
                                    {purchase.totalAmount.toLocaleString('en-NG', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    ₦
                                    {purchase.amountPaid.toLocaleString('en-NG', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    <Typography fontWeight={600} color='error.main'>
                                      ₦
                                      {purchase.balance.toLocaleString('en-NG', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={purchase.status} size='small' color={getStatusColor(purchase.status)} />
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      size='small'
                                      color='primary'
                                      onClick={() => router.push(`/purchases/${purchase.id}`)}
                                      title='View Purchase'
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
                              Total Payable to {supplier.supplierName}
                            </Typography>
                            <Typography variant='h6' color='error.main' fontWeight={600}>
                              ₦
                              {supplier.totalPayable.toLocaleString('en-NG', {
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
              <Alert severity='info'>No outstanding payables found</Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  )
}
