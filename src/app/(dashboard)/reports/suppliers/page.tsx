'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Box,
  Button,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridPaginationModel, GridSortModel, GridColDef } from '@mui/x-data-grid'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

interface RawMaterial {
  id: string
  materialCode: string
  materialName: string
}

interface SupplierReportData {
  id: string
  supplierCode: string
  name: string
  phone: string
  location: string
  createdAt: string
  rawMaterials: RawMaterial[]
  totalMaterials: number
  totalTransactions: number
  totalPurchases: number
  totalOutstanding: number
}

interface ReportSummary {
  totalSuppliers: number
  totalMaterials: number
  totalTransactions: number
  totalPurchases: number
  totalOutstanding: number
}

export default function SupplierReportPage() {
  const [suppliers, setSuppliers] = useState<SupplierReportData[]>([])

  const [summary, setSummary] = useState<ReportSummary>({
    totalSuppliers: 0,
    totalMaterials: 0,
    totalTransactions: 0,
    totalPurchases: 0,
    totalOutstanding: 0
  })

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25
  })

  const [expandedSupplier, setExpandedSupplier] = useState<string | false>(false)

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        search,
        location,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/reports/suppliers?${params}`)
      const result = await response.json()

      if (result.success) {
        setSuppliers(result.data)
        setSummary(result.summary)
      } else {
        console.error('Failed to fetch report:', result.error)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }, [search, location, sortBy, sortOrder])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleSortModelChange = (model: GridSortModel) => {
    if (model.length > 0) {
      setSortBy(model[0].field)
      setSortOrder(model[0].sort || 'asc')
    }
  }

  const handleExport = (format: 'csv' | 'excel') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleAccordionChange = (supplierId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSupplier(isExpanded ? supplierId : false)
  }

  const columns: GridColDef[] = [
    {
      field: 'supplierCode',
      headerName: 'Supplier Code',
      width: 130,
      sortable: true
    },
    {
      field: 'name',
      headerName: 'Supplier Name',
      width: 200,
      sortable: true
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
      sortable: false
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      sortable: true
    },
    {
      field: 'totalMaterials',
      headerName: 'Materials',
      width: 100,
      type: 'number',
      sortable: false
    },
    {
      field: 'totalTransactions',
      headerName: 'Transactions',
      width: 120,
      type: 'number',
      sortable: false
    },
    {
      field: 'totalPurchases',
      headerName: 'Total Purchases',
      width: 150,
      type: 'number',
      sortable: false,
      valueFormatter: (value) => `₦${(value as number)?.toLocaleString() || 0}`
    },
    {
      field: 'totalOutstanding',
      headerName: 'Outstanding',
      width: 140,
      type: 'number',
      sortable: false,
      valueFormatter: (value) => `₦${(value as number)?.toLocaleString() || 0}`,
      cellClassName: (params) => (params.value > 0 ? 'text-error' : 'text-success')
    }
  ]

  return (
    <Box>
      {/* Header */}
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
        <Typography variant='h4'>Supplier Report</Typography>
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
                Total Suppliers
              </Typography>
              <Typography variant='h4'>{summary.totalSuppliers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card>
            <CardContent>
              <Typography color='text.secondary' gutterBottom variant='body2'>
                Raw Materials
              </Typography>
              <Typography variant='h4'>{summary.totalMaterials}</Typography>
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
        <Grid item xs={12} sm={6} md={6} lg={2.4}>
          <Card>
            <CardContent>
              <Typography color='text.secondary' gutterBottom variant='body2'>
                Total Purchases
              </Typography>
              <Typography variant='h4'>₦{summary.totalPurchases.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={2.4}>
          <Card>
            <CardContent>
              <Typography color='text.secondary' gutterBottom variant='body2'>
                Total Outstanding
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Search'
                placeholder='Search by code, name, or phone'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Location'
                placeholder='Filter by location'
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ mb: 3 }}>
        <DataGrid
          rows={suppliers}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          sortingMode='server'
          onSortModelChange={handleSortModelChange}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            '& .text-error': {
              color: 'error.main',
              fontWeight: 600
            },
            '& .text-success': {
              color: 'success.main'
            }
          }}
        />
      </Card>

      {/* Supplier Details with Raw Materials */}
      <Typography variant='h5' mb={2}>
        Supplier Details
      </Typography>
      {suppliers.map(supplier => (
        <Accordion
          key={supplier.id}
          expanded={expandedSupplier === supplier.id}
          onChange={handleAccordionChange(supplier.id)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display='flex' justifyContent='space-between' width='100%' alignItems='center' pr={2}>
              <Box>
                <Typography variant='subtitle1' fontWeight={600}>
                  {supplier.supplierCode} - {supplier.name}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {supplier.location} • {supplier.phone}
                </Typography>
              </Box>
              <Chip label={`${supplier.totalMaterials} Materials`} size='small' color='primary' />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant='subtitle2' mb={2}>
              Raw Materials Supplied:
            </Typography>
            <Box display='flex' flexWrap='wrap' gap={1}>
              {supplier.rawMaterials.map(material => (
                <Chip
                  key={material.id}
                  label={`${material.materialCode} - ${material.materialName}`}
                  variant='outlined'
                  size='small'
                />
              ))}
            </Box>
            {supplier.rawMaterials.length === 0 && (
              <Typography variant='body2' color='text.secondary'>
                No raw materials registered
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}
