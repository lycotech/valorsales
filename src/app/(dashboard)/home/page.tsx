'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

type DashboardStats = {
  totalSales: {
    amount: number
    count: number
    trend: number
  }
  totalPurchases: {
    amount: number
    count: number
    trend: number
  }
  outstandingReceivables: {
    amount: number
    count: number
  }
  outstandingPayables: {
    amount: number
    count: number
  }
  inventory: {
    lowStockProducts: number
    lowStockMaterials: number
    outOfStockProducts: number
    outOfStockMaterials: number
  }
  customers: {
    total: number
    active: number
  }
  products: {
    total: number
    active: number
  }
}

type ChartData = {
  monthlySales: { month: string; label: string; total: number; count: number }[]
  topProducts: {
    productId: string
    productName: string
    productCode: string
    quantitySold: number
    totalRevenue: number
  }[]
  recentTransactions: {
    id: string
    type: 'sale' | 'purchase'
    code: string
    description: string
    products: string
    amount: number
    status: string
    date: string
  }[]
}

export default function Page() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, chartsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/charts')
      ])

      if (statsResponse.ok) {
        const data = await statsResponse.json()

        setStats(data.data)
      }

      if (chartsResponse.ok) {
        const data = await chartsResponse.json()

        setChartData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Chart options
  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `₦${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `₦${(value / 1000).toFixed(0)}k`
        }
      }
    }
  }

  const topProductsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `₦${context.parsed.x.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `₦${(value / 1000).toFixed(0)}k`
        }
      }
    }
  }

  // Prepare chart data
  const salesTrendChartData = {
    labels: chartData?.monthlySales.map(m => m.label) || [],
    datasets: [
      {
        label: 'Sales',
        data: chartData?.monthlySales.map(m => m.total) || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const topProductsChartData = {
    labels:
      chartData?.topProducts.map(p => p.productName.slice(0, 15) + (p.productName.length > 15 ? '...' : '')) || [],
    datasets: [
      {
        label: 'Revenue',
        data: chartData?.topProducts.map(p => p.totalRevenue) || [],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderRadius: 4
      }
    ]
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className='flex flex-col gap-6'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <LinearProgress />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-textSecondary'>Welcome to ValorSales Management System</p>
      </div>

      {/* Main Statistics Cards */}
      <Grid container spacing={4}>
        {/* Total Sales */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box className='flex items-center justify-between mb-2'>
                <Typography variant='body2' color='textSecondary'>
                  Total Sales
                </Typography>
                <Box className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10'>
                  <i className='ri-money-dollar-circle-line text-xl text-primary' />
                </Box>
              </Box>
              <Typography variant='h4' className='font-bold mb-1'>
                ₦{stats?.totalSales.amount.toLocaleString() || '0'}
              </Typography>
              <Box className='flex items-center gap-2'>
                <Typography variant='caption' color='textSecondary'>
                  {stats?.totalSales.count || 0} transactions
                </Typography>
                {stats?.totalSales.trend !== undefined && (
                  <Chip
                    label={`${stats.totalSales.trend > 0 ? '+' : ''}${stats.totalSales.trend}%`}
                    size='small'
                    color={stats.totalSales.trend > 0 ? 'success' : 'error'}
                    className='h-5'
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Purchases */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box className='flex items-center justify-between mb-2'>
                <Typography variant='body2' color='textSecondary'>
                  Total Purchases
                </Typography>
                <Box className='flex items-center justify-center w-10 h-10 rounded-full bg-info/10'>
                  <i className='ri-shopping-cart-line text-xl text-info' />
                </Box>
              </Box>
              <Typography variant='h4' className='font-bold mb-1'>
                ₦{stats?.totalPurchases.amount.toLocaleString() || '0'}
              </Typography>
              <Box className='flex items-center gap-2'>
                <Typography variant='caption' color='textSecondary'>
                  {stats?.totalPurchases.count || 0} transactions
                </Typography>
                {stats?.totalPurchases.trend !== undefined && (
                  <Chip
                    label={`${stats.totalPurchases.trend > 0 ? '+' : ''}${stats.totalPurchases.trend}%`}
                    size='small'
                    color={stats.totalPurchases.trend > 0 ? 'success' : 'error'}
                    className='h-5'
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Outstanding Receivables */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box className='flex items-center justify-between mb-2'>
                <Typography variant='body2' color='textSecondary'>
                  Receivables
                </Typography>
                <Box className='flex items-center justify-center w-10 h-10 rounded-full bg-warning/10'>
                  <i className='ri-arrow-down-circle-line text-xl text-warning' />
                </Box>
              </Box>
              <Typography variant='h4' className='font-bold mb-1'>
                ₦{stats?.outstandingReceivables.amount.toLocaleString() || '0'}
              </Typography>
              <Typography variant='caption' color='textSecondary'>
                {stats?.outstandingReceivables.count || 0} pending payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Outstanding Payables */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box className='flex items-center justify-between mb-2'>
                <Typography variant='body2' color='textSecondary'>
                  Payables
                </Typography>
                <Box className='flex items-center justify-center w-10 h-10 rounded-full bg-error/10'>
                  <i className='ri-arrow-up-circle-line text-xl text-error' />
                </Box>
              </Box>
              <Typography variant='h4' className='font-bold mb-1'>
                ₦{stats?.outstandingPayables.amount.toLocaleString() || '0'}
              </Typography>
              <Typography variant='caption' color='textSecondary'>
                {stats?.outstandingPayables.count || 0} pending payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Secondary Stats Row */}
      <Grid container spacing={4}>
        {/* Inventory Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box className='flex items-center justify-between mb-4'>
                <Typography variant='h6' className='font-semibold'>
                  Inventory Alerts
                </Typography>
                <Link href='/inventory/alerts' className='text-primary hover:underline text-sm'>
                  View All
                </Link>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box className='p-3 rounded-lg bg-error/10'>
                    <Typography variant='h3' className='font-bold text-error mb-1'>
                      {stats?.inventory.outOfStockProducts || 0}
                    </Typography>
                    <Typography variant='caption' color='textSecondary'>
                      Out of Stock (Products)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box className='p-3 rounded-lg bg-warning/10'>
                    <Typography variant='h3' className='font-bold text-warning mb-1'>
                      {stats?.inventory.lowStockProducts || 0}
                    </Typography>
                    <Typography variant='caption' color='textSecondary'>
                      Low Stock (Products)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box className='p-3 rounded-lg bg-error/10'>
                    <Typography variant='h3' className='font-bold text-error mb-1'>
                      {stats?.inventory.outOfStockMaterials || 0}
                    </Typography>
                    <Typography variant='caption' color='textSecondary'>
                      Out of Stock (Materials)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box className='p-3 rounded-lg bg-warning/10'>
                    <Typography variant='h3' className='font-bold text-warning mb-1'>
                      {stats?.inventory.lowStockMaterials || 0}
                    </Typography>
                    <Typography variant='caption' color='textSecondary'>
                      Low Stock (Materials)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' className='font-semibold mb-4'>
                Quick Stats
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box className='flex items-center gap-3'>
                    <Box className='flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10'>
                      <i className='ri-user-line text-2xl text-primary' />
                    </Box>
                    <Box>
                      <Typography variant='h5' className='font-bold'>
                        {stats?.customers.total || 0}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        Total Customers
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box className='flex items-center gap-3'>
                    <Box className='flex items-center justify-center w-12 h-12 rounded-lg bg-success/10'>
                      <i className='ri-user-follow-line text-2xl text-success' />
                    </Box>
                    <Box>
                      <Typography variant='h5' className='font-bold'>
                        {stats?.customers.active || 0}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        Active Customers
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box className='flex items-center gap-3'>
                    <Box className='flex items-center justify-center w-12 h-12 rounded-lg bg-info/10'>
                      <i className='ri-box-3-line text-2xl text-info' />
                    </Box>
                    <Box>
                      <Typography variant='h5' className='font-bold'>
                        {stats?.products.total || 0}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        Total Products
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box className='flex items-center gap-3'>
                    <Box className='flex items-center justify-center w-12 h-12 rounded-lg bg-warning/10'>
                      <i className='ri-checkbox-circle-line text-2xl text-warning' />
                    </Box>
                    <Box>
                      <Typography variant='h5' className='font-bold'>
                        {stats?.products.active || 0}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        Active Products
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={4}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box className='flex items-center justify-between mb-4'>
                <Typography variant='h6' className='font-semibold'>
                  Sales Trend (Last 6 Months)
                </Typography>
                <Link href='/reports/total-sales' className='text-primary hover:underline text-sm'>
                  View Report
                </Link>
              </Box>
              <Box sx={{ height: 300 }}>
                {chartData?.monthlySales && chartData.monthlySales.length > 0 ? (
                  <Line data={salesTrendChartData} options={salesTrendOptions} />
                ) : (
                  <Box className='flex items-center justify-center h-full text-gray-400'>
                    <Typography>No sales data available</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box className='flex items-center justify-between mb-4'>
                <Typography variant='h6' className='font-semibold'>
                  Top Products (This Month)
                </Typography>
                <Link href='/reports/sales-by-product' className='text-primary hover:underline text-sm'>
                  View All
                </Link>
              </Box>
              <Box sx={{ height: 300 }}>
                {chartData?.topProducts && chartData.topProducts.length > 0 ? (
                  <Bar data={topProductsChartData} options={topProductsOptions} />
                ) : (
                  <Box className='flex items-center justify-center h-full text-gray-400'>
                    <Typography>No product sales this month</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Card>
        <CardContent>
          <Box className='flex items-center justify-between mb-4'>
            <Typography variant='h6' className='font-semibold'>
              Recent Transactions
            </Typography>
            <Box className='flex gap-2'>
              <Link href='/sales' className='text-primary hover:underline text-sm'>
                Sales
              </Link>
              <span className='text-gray-400'>|</span>
              <Link href='/purchases' className='text-primary hover:underline text-sm'>
                Purchases
              </Link>
            </Box>
          </Box>
          {chartData?.recentTransactions && chartData.recentTransactions.length > 0 ? (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Customer/Supplier</TableCell>
                    <TableCell>Products</TableCell>
                    <TableCell align='right'>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chartData.recentTransactions.map(transaction => (
                    <TableRow key={`${transaction.type}-${transaction.id}`} hover>
                      <TableCell>
                        <Chip
                          label={transaction.type === 'sale' ? 'Sale' : 'Purchase'}
                          size='small'
                          color={transaction.type === 'sale' ? 'primary' : 'info'}
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={
                            transaction.type === 'sale' ? `/sales/${transaction.id}` : `/purchases/${transaction.id}`
                          }
                          className='text-primary hover:underline'
                        >
                          {transaction.code}
                        </Link>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Typography variant='body2' noWrap sx={{ maxWidth: 200 }}>
                          {transaction.products}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography fontWeight={500}>₦{transaction.amount.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          size='small'
                          color={getStatusColor(transaction.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='textSecondary'>
                          {formatDate(transaction.date)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box className='flex items-center justify-center py-8 text-gray-400'>
              <Typography>No recent transactions</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='font-semibold mb-4'>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Link href='/sales'>
                <Box className='p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer'>
                  <Box className='flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-3'>
                    <i className='ri-shopping-cart-2-line text-2xl text-primary' />
                  </Box>
                  <Typography variant='subtitle1' className='font-semibold mb-1'>
                    New Sale
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>
                    Record a new sales transaction
                  </Typography>
                </Box>
              </Link>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Link href='/purchases'>
                <Box className='p-4 rounded-lg border border-gray-200 hover:border-info hover:bg-info/5 transition-all cursor-pointer'>
                  <Box className='flex items-center justify-center w-12 h-12 rounded-lg bg-info/10 mb-3'>
                    <i className='ri-shopping-bag-3-line text-2xl text-info' />
                  </Box>
                  <Typography variant='subtitle1' className='font-semibold mb-1'>
                    New Purchase
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>
                    Record a new purchase order
                  </Typography>
                </Box>
              </Link>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Link href='/customers'>
                <Box className='p-4 rounded-lg border border-gray-200 hover:border-success hover:bg-success/5 transition-all cursor-pointer'>
                  <Box className='flex items-center justify-center w-12 h-12 rounded-lg bg-success/10 mb-3'>
                    <i className='ri-user-add-line text-2xl text-success' />
                  </Box>
                  <Typography variant='subtitle1' className='font-semibold mb-1'>
                    Add Customer
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>
                    Register a new customer
                  </Typography>
                </Box>
              </Link>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Link href='/inventory/alerts'>
                <Box className='p-4 rounded-lg border border-gray-200 hover:border-warning hover:bg-warning/5 transition-all cursor-pointer'>
                  <Box className='flex items-center justify-center w-12 h-12 rounded-lg bg-warning/10 mb-3'>
                    <i className='ri-alert-line text-2xl text-warning' />
                  </Box>
                  <Typography variant='subtitle1' className='font-semibold mb-1'>
                    Inventory Alerts
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>
                    Check low stock items
                  </Typography>
                </Box>
              </Link>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </div>
  )
}
