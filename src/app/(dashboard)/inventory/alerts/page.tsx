'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, Grid, Typography, Chip, Box } from '@mui/material'

interface InventoryAlert {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  type: 'product' | 'raw_material'
  currentStock: number
  minimumStock: number
  reorderPoint: number
  unit: string
  status: string
  message: string
}

interface AlertsSummary {
  total: number
  products: number
  rawMaterials: number
  outOfStock: number
  lowStock: number
}

export default function InventoryAlertsPage() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [summary, setSummary] = useState<AlertsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/inventory/alerts')
      const data = await response.json()

      if (data.success) {
        setAlerts(data.data.alerts)
        setSummary(data.data.summary)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return 'error'
      case 'low_stock':
        return 'warning'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading alerts...</Typography>
      </Box>
    )
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Inventory Alerts
      </Typography>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Alerts
                </Typography>
                <Typography variant="h4">{summary.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Out of Stock
                </Typography>
                <Typography variant="h4" color="error">
                  {summary.outOfStock}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Low Stock
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {summary.lowStock}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Products
                </Typography>
                <Typography variant="h4">{summary.products}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Raw Materials
                </Typography>
                <Typography variant="h4">{summary.rawMaterials}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <CardContent>
          {alerts.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                ✅ No low stock alerts
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                All items are adequately stocked
              </Typography>
            </Box>
          ) : (
            <Box>
              {alerts.map(alert => (
                <Box
                  key={alert.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: alert.status === 'out_of_stock' ? 'error.main' : 'warning.main',
                    bgcolor: alert.status === 'out_of_stock' ? 'error.lighter' : 'warning.lighter'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">
                        {alert.itemName}
                        <Chip
                          label={alert.type === 'product' ? 'Product' : 'Raw Material'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Code: {alert.itemCode}
                      </Typography>
                      <Typography variant="body1" color="text.primary" sx={{ mt: 1 }}>
                        {alert.message}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Chip label={alert.status.toUpperCase().replace('_', ' ')} color={getStatusColor(alert.status)} />
                      <Typography variant="h5" sx={{ mt: 1 }}>
                        {alert.currentStock} {alert.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reorder at: {alert.reorderPoint} {alert.unit}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
