'use client'

/**
 * Expense Categories Page
 * Displays all expense categories with CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'

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
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import type { ExpenseCategory } from '@prisma/client'

// Component Imports
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

type CategoryWithCount = ExpenseCategory & {
  _count: {
    expenses: number
  }
}

type CategoryListResponse = {
  success: boolean
  data: CategoryWithCount[]
  error?: string
  message?: string
}

const ExpenseCategoriesPage = () => {
  // State
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/financial/categories')
      const data: CategoryListResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch categories')
      }

      setCategories(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle create
  const handleCreateClick = () => {
    setCreateDialogOpen(true)
    setCreateError(null)
    setNewCategoryName('')
    setNewCategoryDescription('')
  }

  const handleCreateConfirm = async () => {
    if (!newCategoryName.trim()) {
      setCreateError('Category name is required')
      return
    }

    try {
      setCreateLoading(true)
      setCreateError(null)

      const response = await fetch('/api/financial/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create category')
      }

      // Close dialog and refresh list
      setCreateDialogOpen(false)
      setNewCategoryName('')
      setNewCategoryDescription('')
      fetchCategories()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error creating category:', err)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCreateCancel = () => {
    setCreateDialogOpen(false)
    setNewCategoryName('')
    setNewCategoryDescription('')
    setCreateError(null)
  }

  // DataGrid columns
  const columns: GridColDef<CategoryWithCount>[] = [
    {
      field: 'name',
      headerName: 'Category Name',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 300,
      renderCell: params => params.value || '-'
    },
    {
      field: '_count',
      headerName: 'Expenses',
      width: 120,
      renderCell: params => params.value?.expenses || 0
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: params => (
        <div className='flex gap-2'>
          <IconButton size='small' color='error' disabled={params.row._count.expenses > 0}>
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
          <h1 className='text-3xl font-bold'>Expense Categories</h1>
          <p className='text-textSecondary'>Manage expense categories for financial tracking</p>
        </div>
        <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreateClick}>
          Add Category
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
        <CardHeader title='All Categories' />
        <DataGrid
          rows={categories}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          disableColumnMenu
          autoHeight
          sx={{ '& .MuiDataGrid-root': { border: 'none' } }}
        />
      </Card>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCreateCancel} maxWidth='sm' fullWidth>
        <DialogTitle>Add Expense Category</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity='error' className='mb-4'>
              {createError}
            </Alert>
          )}
          <div className='flex flex-col gap-4 mt-4'>
            <TextField
              label='Category Name'
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label='Description'
              value={newCategoryDescription}
              onChange={e => setNewCategoryDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateCancel} disabled={createLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreateConfirm} variant='contained' disabled={createLoading}>
            {createLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default ExpenseCategoriesPage
