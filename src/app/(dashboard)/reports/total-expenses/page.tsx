'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'

import { exportToExcel, exportReportToPDF, printPage } from '@/utils/exportHelpers'

interface PaymentMethodData {
  paymentMode: string
  purchaseCount: number
  totalAmount: number
}

interface SupplierData {
  supplierId: string
  supplierName: string
  purchaseCount: number
  totalAmount: number
}

interface PeriodData {
  period: string
  purchaseCount: number
  totalAmount: number
  totalPaid: number
  totalOutstanding: number
  totalQuantity: number
}

interface ReportSummary {
  totalTransactions: number
  totalExpense: number
  totalPaid: number
  totalOutstanding: number
  totalQuantityPurchased: number
  uniqueSuppliers: number
}

export default function TotalExpenseReportPage() {
  const isMounted = useRef(false)
  const [summary, setSummary] = useState<ReportSummary>({
    totalTransactions: 0,
    totalExpense: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalQuantityPurchased: 0,
    uniqueSuppliers: 0
  })

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])
  const [suppliers, setSuppliers] = useState<SupplierData[]>([])
  const [periods, setPeriods] = useState<PeriodData[]>([])
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [groupBy, setGroupBy] = useState('day')

  const fetchReport = useCallback(async () => {
    try {
      const params = new URLSearchParams({ groupBy })

      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await fetch(`/api/reports/total-expenses?${params}`)
      const result = await response.json()

      if (!isMounted.current) return

      if (result.success) {
        setSummary(result.summary)
        setPaymentMethods(result.paymentMethodBreakdown)
        setSuppliers(result.supplierBreakdown)
        setPeriods(result.periodBreakdown)
      } else {
        console.error('Failed to fetch report:', result.error)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    }
  }, [startDate, endDate, groupBy])

  useEffect(() => {
    isMounted.current = true
    fetchReport()

    return () => {
      isMounted.current = false
    }
  }, [fetchReport])

  const handleExportExcel = () => {
    exportToExcel(periods, {
      filename: `total-expense-report-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Expense Report',
      title: 'Total Expense Report',
      subtitle: `Period: ${startDate?.toLocaleDateString() || 'All Time'} - ${endDate?.toLocaleDateString() || 'Present'}`,
      columns: [
        { key: 'period', label: 'Period', width: 20, format: (v: string) => formatPeriod(v) },
        { key: 'purchaseCount', label: 'Transactions', width: 15 },
        { key: 'totalAmount', label: 'Total Amount (₦)', width: 18 },
        { key: 'totalPaid', label: 'Amount Paid (₦)', width: 18 },
        { key: 'totalOutstanding', label: 'Outstanding (₦)', width: 18 }
      ]
    })
  }

  const handleExportPDF = () => {
    exportReportToPDF({
      filename: `total-expense-report-${new Date().toISOString().split('T')[0]}`,
      title: 'Total Expense Report',
      subtitle: `Period: ${startDate?.toLocaleDateString() || 'All Time'} - ${endDate?.toLocaleDateString() || 'Present'}`,
      orientation: 'landscape',
      sections: [
        {
          title: 'Summary',
          type: 'summary' as const,
          summaryItems: [
            { label: 'Total Transactions', value: summary.totalTransactions || 0 },
            { label: 'Unique Suppliers', value: summary.uniqueSuppliers || 0 },
            { label: 'Total Expense', value: `₦${(summary.totalExpense || 0).toLocaleString()}` },
            { label: 'Amount Paid', value: `₦${(summary.totalPaid || 0).toLocaleString()}` },
            { label: 'Outstanding', value: `₦${(summary.totalOutstanding || 0).toLocaleString()}` }
          ]
        },
        {
          title: 'Payment Methods Breakdown',
          type: 'table' as const,
          data: paymentMethods,
          columns: [
            { key: 'paymentMode', label: 'Payment Method', format: (v: string) => getPaymentModeLabel(v) },
            { key: 'purchaseCount', label: 'Transactions' },
            { key: 'totalAmount', label: 'Total Amount (₦)', format: (v: number) => `₦${Number(v).toLocaleString()}` }
          ]
        },
        {
          title: 'Top Suppliers',
          type: 'table' as const,
          data: suppliers.slice(0, 10),
          columns: [
            { key: 'supplierName', label: 'Supplier' },
            { key: 'purchaseCount', label: 'Transactions' },
            { key: 'totalAmount', label: 'Total Amount (₦)', format: (v: number) => `₦${Number(v).toLocaleString()}` }
          ]
        },
        {
          title: `Expenses by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`,
          type: 'table' as const,
          data: periods,
          columns: [
            { key: 'period', label: 'Period', format: (v: string) => formatPeriod(v) },
            { key: 'purchaseCount', label: 'Transactions' },
            { key: 'totalAmount', label: 'Total (₦)', format: (v: number) => `₦${Number(v).toLocaleString()}` },
            { key: 'totalPaid', label: 'Paid (₦)', format: (v: number) => `₦${Number(v).toLocaleString()}` },
            { key: 'totalOutstanding', label: 'Outstanding (₦)', format: (v: number) => `₦${Number(v).toLocaleString()}` }
          ]
        }
      ]
    })
  }

  const handlePrint = () => {
    printPage()
  }

  const formatPeriod = (period: string) => {
    if (groupBy === 'day') {
      return new Date(period).toLocaleDateString()
    } else if (groupBy === 'week') {
      return `Week of ${new Date(period).toLocaleDateString()}`
    } else if (groupBy === 'month') {
      const [year, month] = period.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)

      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    } else if (groupBy === 'year') {
      return period
    }

    return period
  }

  const getPaymentModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      transfer: 'Bank Transfer',
      cheque: 'Cheque',
      credit: 'Credit',
      unpaid: 'Unpaid',
      others: 'Others'
    }

    return labels[mode] || mode
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
          <Typography variant='h4'>Total Expense Report</Typography>
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
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Total Transactions
                </Typography>
                <Typography variant='h4'>{summary.totalTransactions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Unique Suppliers
                </Typography>
                <Typography variant='h4'>{summary.uniqueSuppliers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Total Expense
                </Typography>
                <Typography color='error.main' variant='h4'>
                  ₦{(summary.totalExpense || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Amount Paid
                </Typography>
                <Typography variant='h4'>₦{(summary.totalPaid || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Outstanding
                </Typography>
                <Typography color='warning.main' variant='h4'>
                  ₦{(summary.totalOutstanding || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Qty Purchased
                </Typography>
                <Typography variant='h4'>{(summary.totalQuantityPurchased || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label='Start Date'
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label='End Date'
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label='Group By' value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                  <MenuItem value='day'>Daily</MenuItem>
                  <MenuItem value='week'>Weekly</MenuItem>
                  <MenuItem value='month'>Monthly</MenuItem>
                  <MenuItem value='year'>Yearly</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Payment Method & Top Suppliers */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' mb={2}>
                  Payment Method Breakdown
                </Typography>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Payment Method</TableCell>
                        <TableCell align='right'>Transactions</TableCell>
                        <TableCell align='right'>Total Amount</TableCell>
                        <TableCell align='right'>%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentMethods.map(method => (
                        <TableRow key={method.paymentMode}>
                          <TableCell>{getPaymentModeLabel(method.paymentMode)}</TableCell>
                          <TableCell align='right'>{method.purchaseCount}</TableCell>
                          <TableCell align='right'>₦{(method.totalAmount || 0).toLocaleString()}</TableCell>
                          <TableCell align='right'>
                            {(summary.totalExpense || 0) > 0
                              ? (((method.totalAmount || 0) / summary.totalExpense) * 100).toFixed(1)
                              : 0}
                            %
                          </TableCell>
                        </TableRow>
                      ))}
                      {paymentMethods.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align='center'>
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' mb={2}>
                  Top Suppliers
                </Typography>
                <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: 400 }}>
                  <Table size='small' stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Supplier</TableCell>
                        <TableCell align='right'>Purchases</TableCell>
                        <TableCell align='right'>Total Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {suppliers.slice(0, 10).map(supplier => (
                        <TableRow key={supplier.supplierId}>
                          <TableCell>{supplier.supplierName}</TableCell>
                          <TableCell align='right'>{supplier.purchaseCount}</TableCell>
                          <TableCell align='right'>₦{(supplier.totalAmount || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {suppliers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align='center'>
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Expense Trend */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' mb={2}>
              Expense Trend
            </Typography>
            <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: 400 }}>
              <Table size='small' stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align='right'>Purchases</TableCell>
                    <TableCell align='right'>Total Expense</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.map((period, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatPeriod(period.period)}</TableCell>
                      <TableCell align='right'>{period.purchaseCount || 0}</TableCell>
                      <TableCell align='right'>₦{(period.totalAmount || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {periods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align='center'>
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Detailed Period Breakdown */}
        <Card>
          <CardContent>
            <Typography variant='h6' mb={2}>
              Detailed Breakdown
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align='right'>Transactions</TableCell>
                    <TableCell align='right'>Total Amount</TableCell>
                    <TableCell align='right'>Amount Paid</TableCell>
                    <TableCell align='right'>Outstanding</TableCell>
                    <TableCell align='right'>Payment Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.map((period, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatPeriod(period.period)}</TableCell>
                      <TableCell align='right'>{period.purchaseCount || 0}</TableCell>
                      <TableCell align='right'>₦{(period.totalAmount || 0).toLocaleString()}</TableCell>
                      <TableCell align='right'>₦{(period.totalPaid || 0).toLocaleString()}</TableCell>
                      <TableCell align='right'>
                        <Typography color='error'>₦{(period.totalOutstanding || 0).toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        {(period.totalAmount || 0) > 0
                          ? `${(((period.totalPaid || 0) / period.totalAmount) * 100).toFixed(1)}%`
                          : '0%'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {periods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align='center'>
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  )
}
