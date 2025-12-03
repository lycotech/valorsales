'use client'

import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Box,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridPaginationModel, GridColDef } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

interface SaleDetail {
  id: string
  supplyDate: string
  productId: string
  productCode: string
  productName: string
  quantity: number
  totalAmount: number
  amountPaid: number
  balance: number
  status: string
  agingDays: number
  lastPaymentDate: string | null
}

interface CustomerReceivable {
  customerId: string
  customerCode: string
  customerName: string
  phone: string
  location: string
  totalSales: number
  totalPaid: number
  totalReceivable: number
  salesCount: number
  sales: SaleDetail[]
}

interface ReportSummary {
  totalCustomers: number
  totalSales: number
  totalAmount: number
  totalPaid: number
  totalReceivable: number
}

export default function OutstandingReceivablesPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerReceivable[]>([])

  const [summary, setSummary] = useState<ReportSummary>({
    totalCustomers: 0,
    totalSales: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalReceivable: 0
  })

  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [agingDays, setAgingDays] = useState('0')

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25
  })

  const [expandedCustomer, setExpandedCustomer] = useState<string | false>(false)

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        status,
        agingDays
      })

      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await fetch(`/api/reports/outstanding-receivables?${params}`)
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
  }, [status, startDate, endDate, agingDays])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExport = (format: 'csv' | 'excel') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleAccordionChange = (customerId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedCustomer(isExpanded ? customerId : false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'partial':
        return 'warning'
      case 'pending':
        return 'error'
      default:
        return 'default'
    }
  }

  const getAgingColor = (days: number) => {
    if (days > 90) return 'error'
    if (days > 60) return 'warning'
    if (days > 30) return 'info'

    return 'default'
  }

  const columns: GridColDef[] = [
    {
      field: 'customerCode',
      headerName: 'Customer Code',
      width: 130
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      width: 200
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
      headerName: 'Sales',
      width: 80,
      type: 'number'
    },
    {
      field: 'totalSales',
      headerName: 'Total Amount',
      width: 140,
      type: 'number',
      valueFormatter: (value) => `₦${(value as number)?.toLocaleString() || 0}`
    },
    {
      field: 'totalPaid',
      headerName: 'Amount Paid',
      width: 140,
      type: 'number',
      valueFormatter: (value) => `₦${(value as number)?.toLocaleString() || 0}`
    },
    {
      field: 'totalReceivable',
      headerName: 'Receivable',
      width: 140,
      type: 'number',
      valueFormatter: (value) => `₦${(value as number)?.toLocaleString() || 0}`,
      cellClassName: () => 'text-error'
    }
  ]

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
          <Typography variant='h4'>Outstanding Receivables Report</Typography>
          <Box display='flex' gap={1}>
            <IconButton onClick={fetchReport} title='Refresh'>
              <RefreshIcon />
            </IconButton>
            <Button variant='outlined' startIcon={<DownloadIcon />} onClick={() => handleExport('excel')}>
              Export Excel
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
                  Customers
                </Typography>
                <Typography variant='h4'>{summary.totalCustomers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Total Sales
                </Typography>
                <Typography variant='h4'>{summary.totalSales}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Total Amount
                </Typography>
                <Typography variant='h4'>₦{summary.totalAmount.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Amount Paid
                </Typography>
                <Typography variant='h4'>₦{summary.totalPaid.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Total Receivable
                </Typography>
                <Typography color='error' variant='h4'>
                  ₦{summary.totalReceivable.toLocaleString()}
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
                <TextField
                  fullWidth
                  select
                  label='Status'
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <MenuItem value='all'>All Outstanding</MenuItem>
                  <MenuItem value='partial'>Partially Paid</MenuItem>
                  <MenuItem value='pending'>Pending Payment</MenuItem>
                </TextField>
              </Grid>
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
                <TextField
                  fullWidth
                  select
                  label='Aging'
                  value={agingDays}
                  onChange={e => setAgingDays(e.target.value)}
                >
                  <MenuItem value='0'>All</MenuItem>
                  <MenuItem value='30'>Over 30 days</MenuItem>
                  <MenuItem value='60'>Over 60 days</MenuItem>
                  <MenuItem value='90'>Over 90 days</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Customer Summary Grid */}
        <Card sx={{ mb: 3 }}>
          <DataGrid
            rows={customers}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            getRowId={row => row.customerId}
            autoHeight
            sx={{
              '& .text-error': {
                color: 'error.main',
                fontWeight: 600
              }
            }}
          />
        </Card>

        {/* Customer Details with Sales Drill-down */}
        <Typography variant='h5' mb={2}>
          Customer Details
        </Typography>
        {customers.map(customer => (
          <Accordion
            key={customer.customerId}
            expanded={expandedCustomer === customer.customerId}
            onChange={handleAccordionChange(customer.customerId)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display='flex' justifyContent='space-between' width='100%' alignItems='center' pr={2}>
                <Box>
                  <Typography variant='subtitle1' fontWeight={600}>
                    {customer.customerCode} - {customer.customerName}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {customer.location} • {customer.phone}
                  </Typography>
                </Box>
                <Typography color='error' variant='h6'>
                  ₦{customer.totalReceivable.toLocaleString()}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align='right'>Qty</TableCell>
                      <TableCell align='right'>Total</TableCell>
                      <TableCell align='right'>Paid</TableCell>
                      <TableCell align='right'>Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Aging</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customer.sales.map(sale => (
                      <TableRow key={sale.id}>
                        <TableCell>{new Date(sale.supplyDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {sale.productCode} - {sale.productName}
                        </TableCell>
                        <TableCell align='right'>{sale.quantity}</TableCell>
                        <TableCell align='right'>₦{sale.totalAmount.toLocaleString()}</TableCell>
                        <TableCell align='right'>₦{sale.amountPaid.toLocaleString()}</TableCell>
                        <TableCell align='right'>
                          <Typography color='error' fontWeight={600}>
                            ₦{sale.balance.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={sale.status} color={getStatusColor(sale.status)} size='small' />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${sale.agingDays} days`}
                            color={getAgingColor(sale.agingDays)}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Button size='small' onClick={() => router.push(`/sales/${sale.id}`)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={2} display='flex' justifyContent='flex-end'>
                <Typography variant='subtitle2' mr={2}>
                  Total Receivable:
                </Typography>
                <Typography color='error' variant='subtitle1' fontWeight={600}>
                  ₦{customer.totalReceivable.toLocaleString()}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </LocalizationProvider>
  )
}
