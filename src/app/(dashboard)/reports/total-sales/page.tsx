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

import { exportToExcel, exportToPDF, exportReportToPDF, printPage } from '@/utils/exportHelpers'

interface PaymentMethodData {
  paymentMode: string
  salesCount: number
  totalAmount: number
}

interface PeriodData {
  period: string
  salesCount: number
  totalAmount: number
  totalPaid: number
  totalOutstanding: number
}

interface ReportSummary {
  totalTransactions: number
  totalRevenue: number
  totalPaid: number
  totalOutstanding: number
  totalQuantitySold: number
}

export default function TotalSalesReportPage() {
  const isMounted = useRef(false)
  const [summary, setSummary] = useState<ReportSummary>({
    totalTransactions: 0,
    totalRevenue: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalQuantitySold: 0
  })

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])
  const [periods, setPeriods] = useState<PeriodData[]>([])
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [groupBy, setGroupBy] = useState('day')

  const fetchReport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        groupBy
      })

      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await fetch(`/api/reports/total-sales?${params}`)
      const result = await response.json()

      if (!isMounted.current) return

      if (result.success) {
        setSummary(result.summary)
        setPaymentMethods(result.paymentMethodBreakdown)
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
    // Export period breakdown to Excel
    exportToExcel(periods, {
      filename: `total-sales-report-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Sales Report',
      title: 'Total Sales Report',
      subtitle: `Period: ${startDate?.toLocaleDateString() || 'All Time'} - ${endDate?.toLocaleDateString() || 'Present'}`,
      columns: [
        { key: 'period', label: 'Period', width: 20, format: v => formatPeriod(v) },
        { key: 'salesCount', label: 'Transactions', width: 15 },
        { key: 'totalAmount', label: 'Total Amount (₦)', width: 18 },
        { key: 'totalPaid', label: 'Amount Paid (₦)', width: 18 },
        { key: 'totalOutstanding', label: 'Outstanding (₦)', width: 18 }
      ]
    })
  }

  const handleExportPDF = () => {
    exportReportToPDF({
      filename: `total-sales-report-${new Date().toISOString().split('T')[0]}`,
      title: 'Total Sales Report',
      subtitle: `Period: ${startDate?.toLocaleDateString() || 'All Time'} - ${endDate?.toLocaleDateString() || 'Present'}`,
      orientation: 'landscape',
      sections: [
        {
          title: 'Summary',
          type: 'summary',
          summaryItems: [
            { label: 'Total Transactions', value: summary.totalTransactions },
            { label: 'Quantity Sold', value: summary.totalQuantitySold.toLocaleString() },
            { label: 'Total Revenue', value: `₦${summary.totalRevenue.toLocaleString()}` },
            { label: 'Amount Collected', value: `₦${summary.totalPaid.toLocaleString()}` },
            { label: 'Outstanding', value: `₦${summary.totalOutstanding.toLocaleString()}` }
          ]
        },
        {
          title: 'Payment Methods Breakdown',
          type: 'table',
          data: paymentMethods,
          columns: [
            { key: 'paymentMode', label: 'Payment Method', format: v => getPaymentModeLabel(v) },
            { key: 'salesCount', label: 'Transactions' },
            { key: 'totalAmount', label: 'Total Amount (₦)', format: v => `₦${Number(v).toLocaleString()}` }
          ]
        },
        {
          title: `Sales by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`,
          type: 'table',
          data: periods,
          columns: [
            { key: 'period', label: 'Period', format: v => formatPeriod(v) },
            { key: 'salesCount', label: 'Transactions' },
            { key: 'totalAmount', label: 'Total (₦)', format: v => `₦${Number(v).toLocaleString()}` },
            { key: 'totalPaid', label: 'Paid (₦)', format: v => `₦${Number(v).toLocaleString()}` },
            { key: 'totalOutstanding', label: 'Outstanding (₦)', format: v => `₦${Number(v).toLocaleString()}` }
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
      credit: 'Credit Sale',
      others: 'Others'
    }

    return labels[mode] || mode
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
          <Typography variant='h4'>Total Sales Report</Typography>
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
                  Total Transactions
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
                <Typography variant='h4'>{summary.totalQuantitySold.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Total Revenue
                </Typography>
                <Typography color='success.main' variant='h4'>
                  ₦{summary.totalRevenue.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={2.4}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' gutterBottom variant='body2'>
                  Amount Collected
                </Typography>
                <Typography variant='h4'>₦{summary.totalPaid.toLocaleString()}</Typography>
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

        {/* Payment Method Breakdown */}
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
                          <TableCell align='right'>{method.salesCount}</TableCell>
                          <TableCell align='right'>₦{method.totalAmount.toLocaleString()}</TableCell>
                          <TableCell align='right'>
                            {summary.totalRevenue > 0
                              ? ((method.totalAmount / summary.totalRevenue) * 100).toFixed(1)
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

          {/* Period Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' mb={2}>
                  Sales Trend
                </Typography>
                <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: 400 }}>
                  <Table size='small' stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell align='right'>Sales</TableCell>
                        <TableCell align='right'>Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {periods.map((period, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatPeriod(period.period)}</TableCell>
                          <TableCell align='right'>{period.salesCount}</TableCell>
                          <TableCell align='right'>₦{period.totalAmount.toLocaleString()}</TableCell>
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
          </Grid>
        </Grid>

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
                    <TableCell align='right'>Amount Collected</TableCell>
                    <TableCell align='right'>Outstanding</TableCell>
                    <TableCell align='right'>Collection Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.map((period, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatPeriod(period.period)}</TableCell>
                      <TableCell align='right'>{period.salesCount}</TableCell>
                      <TableCell align='right'>₦{period.totalAmount.toLocaleString()}</TableCell>
                      <TableCell align='right'>₦{period.totalPaid.toLocaleString()}</TableCell>
                      <TableCell align='right'>
                        <Typography color='error'>₦{period.totalOutstanding.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        {period.totalAmount > 0
                          ? `${((period.totalPaid / period.totalAmount) * 100).toFixed(1)}%`
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
