'use client'

/**
 * Profit & Loss Report Page
 * Comprehensive P&L statement showing revenue, COGS, expenses, and profitability
 */

import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'

type PLReportData = {
  period: {
    startDate: string
    endDate: string
  }
  revenue: {
    total: number
    breakdown: Array<{
      id: string
      saleCode: string | null
      date: Date
      customer: string
      amount: number
    }>
  }
  cogs: {
    total: number
    breakdown: Array<{
      id: string
      date: Date
      supplier: string
      material: string
      amount: number
    }>
  }
  grossProfit: number
  grossProfitMargin: number
  expenses: {
    total: number
    byCategory: Array<{
      categoryId: string
      categoryName: string
      amount: number
    }>
    breakdown: Array<{
      id: string
      date: Date
      category: string
      description: string | null
      amount: number
    }>
  }
  netProfit: number
  netProfitMargin: number
}

type PLReportResponse = {
  success: boolean
  data: PLReportData
  error?: string
  message?: string
}

const ProfitLossPage = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<PLReportData | null>(null)

  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()))

  // Fetch report data
  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      const response = await fetch(`/api/reports/profit-loss?${params}`)
      const data: PLReportResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch report')
      }

      setReportData(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching P&L report:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load report on mount
  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Quick date filters
  const setThisMonth = () => {
    setStartDate(startOfMonth(new Date()))
    setEndDate(endOfMonth(new Date()))
  }

  const setLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1)
    setStartDate(startOfMonth(lastMonth))
    setEndDate(endOfMonth(lastMonth))
  }

  const setThisYear = () => {
    setStartDate(startOfYear(new Date()))
    setEndDate(endOfYear(new Date()))
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className='flex flex-col gap-6'>
        {/* Header */}
        <div>
          <Typography variant='h4' gutterBottom>
            Profit & Loss Statement
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Comprehensive financial performance report
          </Typography>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Date Range Filters */}
        <Card>
          <CardHeader title='Report Period' />
          <CardContent>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label='Start Date'
                  value={startDate}
                  onChange={date => setStartDate(date)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label='End Date'
                  value={endDate}
                  onChange={date => setEndDate(date)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display='flex' gap={1} flexWrap='wrap'>
                  <Button variant='outlined' size='small' onClick={setThisMonth}>
                    This Month
                  </Button>
                  <Button variant='outlined' size='small' onClick={setLastMonth}>
                    Last Month
                  </Button>
                  <Button variant='outlined' size='small' onClick={setThisYear}>
                    This Year
                  </Button>
                  <Button variant='contained' size='small' onClick={fetchReport} disabled={loading}>
                    Generate Report
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
            <CircularProgress />
          </Box>
        )}

        {/* Report Content */}
        {!loading && reportData && (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Typography variant='caption' color='text.secondary'>
                      Revenue
                    </Typography>
                    <Typography variant='h5' fontWeight={600} color='primary.main'>
                      {formatCurrency(reportData.revenue.total)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Typography variant='caption' color='text.secondary'>
                      COGS
                    </Typography>
                    <Typography variant='h5' fontWeight={600} color='error.main'>
                      {formatCurrency(reportData.cogs.total)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography variant='caption' color='text.secondary'>
                      Gross Profit
                    </Typography>
                    <Typography variant='h5' fontWeight={600}>
                      {formatCurrency(reportData.grossProfit)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Margin: {reportData.grossProfitMargin.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Typography variant='caption' color='text.secondary'>
                      Expenses
                    </Typography>
                    <Typography variant='h5' fontWeight={600} color='warning.main'>
                      {formatCurrency(reportData.expenses.total)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: reportData.netProfit >= 0 ? 'success.main' : 'error.main', color: 'white' }}>
                  <CardContent>
                    <Typography variant='caption' sx={{ color: 'inherit' }}>
                      Net Profit
                    </Typography>
                    <Typography variant='h5' fontWeight={700} sx={{ color: 'inherit' }}>
                      {formatCurrency(reportData.netProfit)}
                    </Typography>
                    <Typography variant='caption' sx={{ color: 'inherit' }}>
                      Margin: {reportData.netProfitMargin.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Detailed P&L Statement */}
            <Card>
              <CardHeader title='Profit & Loss Statement' />
              <CardContent>
                {/* Revenue Section */}
                <Box mb={3}>
                  <Typography variant='h6' gutterBottom>
                    REVENUE
                  </Typography>
                  <Box display='flex' justifyContent='space-between' px={2}>
                    <Typography>Sales Revenue</Typography>
                    <Typography fontWeight={600}>{formatCurrency(reportData.revenue.total)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* COGS Section */}
                <Box mb={3}>
                  <Typography variant='h6' gutterBottom>
                    COST OF GOODS SOLD
                  </Typography>
                  <Box display='flex' justifyContent='space-between' px={2}>
                    <Typography>Raw Material Purchases</Typography>
                    <Typography fontWeight={600}>{formatCurrency(reportData.cogs.total)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderStyle: 'double', borderWidth: 3 }} />

                {/* Gross Profit */}
                <Box mb={3}>
                  <Box display='flex' justifyContent='space-between' px={2}>
                    <Typography variant='h6'>GROSS PROFIT</Typography>
                    <Typography variant='h6' color={reportData.grossProfit >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(reportData.grossProfit)}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' px={2}>
                    <Typography variant='caption' color='text.secondary'>
                      Gross Profit Margin
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {reportData.grossProfitMargin.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Operating Expenses */}
                <Box mb={3}>
                  <Typography variant='h6' gutterBottom>
                    OPERATING EXPENSES
                  </Typography>
                  {reportData.expenses.byCategory.map(cat => (
                    <Box key={cat.categoryId} display='flex' justifyContent='space-between' px={2} py={0.5}>
                      <Typography>{cat.categoryName}</Typography>
                      <Typography>{formatCurrency(cat.amount)}</Typography>
                    </Box>
                  ))}
                  <Box display='flex' justifyContent='space-between' px={2} pt={1}>
                    <Typography fontWeight={600}>Total Operating Expenses</Typography>
                    <Typography fontWeight={600}>{formatCurrency(reportData.expenses.total)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderStyle: 'double', borderWidth: 3 }} />

                {/* Net Profit */}
                <Box>
                  <Box display='flex' justifyContent='space-between' px={2}>
                    <Typography variant='h5' fontWeight={700}>
                      NET PROFIT
                    </Typography>
                    <Typography
                      variant='h5'
                      fontWeight={700}
                      color={reportData.netProfit >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(reportData.netProfit)}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' px={2}>
                    <Typography variant='caption' color='text.secondary'>
                      Net Profit Margin
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {reportData.netProfitMargin.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </LocalizationProvider>
  )
}

export default ProfitLossPage
