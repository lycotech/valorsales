'use client'

import { useState, useEffect, useCallback } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  Chip
} from '@mui/material'

/**
 * Supplier List Page
 * Displays all suppliers in a DataGrid with search and pagination
 */
export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10
  })

  const [rowCount, setRowCount] = useState(0)

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    supplierId: string | null
    supplierName: string
  }>({
    open: false,
    supplierId: null,
    supplierName: ''
  })

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        pageSize: paginationModel.pageSize.toString(),
        ...(search && { search })
      })

      const response = await fetch(`/api/suppliers?${params}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch suppliers')
      }

      setSuppliers(result.data || [])
      setRowCount(result.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, search])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.supplierId) return

    try {
      const response = await fetch(`/api/suppliers/${deleteDialog.supplierId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete supplier')
      }

      // Refresh the list
      fetchSuppliers()
      setDeleteDialog({ open: false, supplierId: null, supplierName: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete supplier')
      setDeleteDialog({ open: false, supplierId: null, supplierName: '' })
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'supplierCode',
      headerName: 'Supplier Code',
      width: 130,
      renderCell: params => (
        <Link
          href={`/suppliers/${params.row.id}`}
          style={{ color: 'var(--mui-palette-primary-main)', textDecoration: 'none' }}
        >
          {params.value}
        </Link>
      )
    },
    {
      field: 'name',
      headerName: 'Supplier Name',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130
    },
    {
      field: 'location',
      headerName: 'Location',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 100,
      renderCell: params => (
        <Chip label={params.row._count?.items || 0} size='small' color='primary' variant='tonal' />
      )
    },
    {
      field: 'purchases',
      headerName: 'Purchases',
      width: 110,
      renderCell: params => (
        <Chip label={params.row._count?.purchases || 0} size='small' color='secondary' variant='tonal' />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size='small'
            color='primary'
            onClick={() => router.push(`/suppliers/${params.row.id}`)}
            title='View'
          >
            <i className='ri-eye-line' />
          </IconButton>
          <IconButton
            size='small'
            color='secondary'
            onClick={() => router.push(`/suppliers/edit/${params.row.id}`)}
            title='Edit'
          >
            <i className='ri-edit-line' />
          </IconButton>
          <IconButton
            size='small'
            color='error'
            onClick={() =>
              setDeleteDialog({
                open: true,
                supplierId: params.row.id,
                supplierName: params.row.name
              })
            }
            title='Delete'
          >
            <i className='ri-delete-bin-line' />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h4'>Suppliers</Typography>
          <Button
            variant='contained'
            color='primary'
            component={Link}
            href='/suppliers/new'
            startIcon={<i className='ri-add-line' />}
          >
            Add Supplier
          </Button>
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder='Search suppliers by name, code, phone, location, or address...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box component='i' className='ri-search-line' sx={{ marginInlineEnd: 2 }} />
              )
            }}
          />
        </Box>

        <DataGrid
          rows={suppliers}
          columns={columns}
          pagination
          paginationMode='server'
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={rowCount}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            }
          }}
        />
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, supplierId: null, supplierName: '' })}
      >
        <DialogTitle>Delete Supplier</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.supplierName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, supplierId: null, supplierName: '' })}>Cancel</Button>
          <Button onClick={handleDelete} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
