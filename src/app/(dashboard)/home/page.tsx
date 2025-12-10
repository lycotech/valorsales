'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { Card, CardContent, Grid, Typography, Box, Chip, LinearProgress } from '@mui/material'

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

export default function Page() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')

      if (response.ok) {
        const data = await response.json()

        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
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
