'use client'

/**
 * Customers List Page
 * Displays all customers in a DataGrid with search, filter, and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import type { Customer } from '@prisma/client'

// Component Imports
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'

type CustomerListResponse = {
  success: boolean
  data: Customer[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  error?: string
  message?: string
}

const CustomersPage = () => {
  const router = useRouter()

  // State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10
  })

  const [rowCount, setRowCount] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        pageSize: paginationModel.pageSize.toString(),
        ...(search && { search })
      })

      const response = await fetch(`/api/customers?${params}`)
      const data: CustomerListResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch customers')
      }

      setCustomers(data.data)
      setRowCount(data.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, search])

  // Load customers on mount and when dependencies change
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Handle search with debounce
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  // Handle delete
  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDeleteDialogOpen(true)
    setDeleteError(null)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)

      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete customer')
      }

      // Close dialog and refresh list
      setDeleteDialogOpen(false)
      setSelectedCustomer(null)
      fetchCustomers()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error deleting customer:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setSelectedCustomer(null)
    setDeleteError(null)
  }

  // DataGrid columns
  const columns: GridColDef<Customer>[] = [
    {
      field: 'customerCode',
      headerName: 'Code',
      width: 120,
      sortable: false
    },
    {
      field: 'businessName',
      headerName: 'Business Name',
      flex: 1,
      minWidth: 200,
      sortable: false
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
      flex: 1,
      minWidth: 150,
      sortable: false
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1,
      minWidth: 200,
      sortable: false
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: params => (
        <div className='flex gap-2'>
          <IconButton size='small' color='primary' onClick={() => router.push(`/customers/${params.row.id}`)}>
            <VisibilityIcon fontSize='small' />
          </IconButton>
          <IconButton size='small' color='primary' onClick={() => router.push(`/customers/edit/${params.row.id}`)}>
            <EditIcon fontSize='small' />
          </IconButton>
          <IconButton size='small' color='error' onClick={() => handleDeleteClick(params.row)}>
            <DeleteIcon fontSize='small' />
          </IconButton>
        </div>
      )
    }
  ]

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Customers</h1>
          <p className='text-textSecondary'>Manage customer information</p>
        </div>
        <Button variant='contained' startIcon={<AddIcon />} onClick={() => router.push('/customers/new')}>
          Add Customer
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Data Grid Card */}
      <Card>
        <CardHeader
          title={
            <TextField
              size='small'
              placeholder='Search customers...'
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon className='mr-2' />
              }}
              sx={{ width: 300 }}
            />
          }
        />
        <DataGrid
          rows={customers}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          rowCount={rowCount}
          paginationMode='server'
          loading={loading}
          disableRowSelectionOnClick
          disableColumnMenu
          autoHeight
          sx={{ '& .MuiDataGrid-root': { border: 'none' } }}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth='sm' fullWidth>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity='error' className='mb-4'>
              {deleteError}
            </Alert>
          )}
          <p>
            Are you sure you want to delete customer <strong>{selectedCustomer?.businessName}</strong> (
            {selectedCustomer?.customerCode})?
          </p>
          <p className='text-textSecondary mt-2'>This action cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained' disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default CustomersPage
