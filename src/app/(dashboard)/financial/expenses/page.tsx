'use client'

/**
 * Expenses Page
 * Displays all expenses with filtering and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import type { Expense, ExpenseCategory } from '@prisma/client'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

// Component Imports
import AddIcon from '@mui/icons-material/Add'

type ExpenseWithCategory = Expense & {
  category: ExpenseCategory
  amount: number
}

type ExpenseListResponse = {
  success: boolean
  data: ExpenseWithCategory[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  error?: string
  message?: string
}

type CategoryListResponse = {
  success: boolean
  data: ExpenseCategory[]
}

const PAYMENT_METHODS = ['cash', 'transfer', 'pos', 'cheque', 'others']

const ExpensesPage = () => {
  // State
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10
  })

  const [rowCount, setRowCount] = useState(0)

  // Filter state
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null)
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null)

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newExpense, setNewExpense] = useState({
    amount: '',
    date: new Date(),
    categoryId: '',
    description: '',
    paymentMethod: 'cash',
    reference: ''
  })

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/financial/categories')
      const data: CategoryListResponse = await response.json()

      if (response.ok && data.success) {
        setCategories(data.data)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        pageSize: paginationModel.pageSize.toString(),
        ...(filterCategoryId && { categoryId: filterCategoryId }),
        ...(filterStartDate && { startDate: filterStartDate.toISOString() }),
        ...(filterEndDate && { endDate: filterEndDate.toISOString() })
      })

      const response = await fetch(`/api/financial/expenses?${params}`)
      const data: ExpenseListResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch expenses')
      }

      setExpenses(data.data)
      setRowCount(data.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching expenses:', err)
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, filterCategoryId, filterStartDate, filterEndDate])

  // Load data on mount
  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Handle create
  const handleCreateClick = () => {
    setCreateDialogOpen(true)
    setCreateError(null)
    setNewExpense({
      amount: '',
      date: new Date(),
      categoryId: '',
      description: '',
      paymentMethod: 'cash',
      reference: ''
    })
  }

  const handleCreateConfirm = async () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      setCreateError('Valid amount is required')
      return
    }

    if (!newExpense.categoryId) {
      setCreateError('Category is required')
      return
    }

    try {
      setCreateLoading(true)
      setCreateError(null)

      const response = await fetch('/api/financial/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(newExpense.amount),
          date: newExpense.date.toISOString(),
          categoryId: newExpense.categoryId,
          description: newExpense.description.trim() || undefined,
          paymentMethod: newExpense.paymentMethod,
          reference: newExpense.reference.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create expense')
      }

      // Close dialog and refresh list
      setCreateDialogOpen(false)
      fetchExpenses()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error creating expense:', err)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCreateCancel = () => {
    setCreateDialogOpen(false)
    setCreateError(null)
  }

  // DataGrid columns
  const columns: GridColDef<ExpenseWithCategory>[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      renderCell: params => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      minWidth: 150,
      renderCell: params => params.value?.name || '-'
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 200,
      renderCell: params => params.value || '-'
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      renderCell: params => `₦${params.value.toLocaleString()}`
    },
    {
      field: 'paymentMethod',
      headerName: 'Payment Method',
      width: 140,
      renderCell: params => params.value.toUpperCase()
    },
    {
      field: 'reference',
      headerName: 'Reference',
      width: 130,
      renderCell: params => params.value || '-'
    }
  ]

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className='flex flex-col gap-6'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold'>Expenses</h1>
            <p className='text-textSecondary'>Track and manage business expenses</p>
          </div>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreateClick}>
            Add Expense
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader title='Filters' />
          <div className='p-4 flex gap-4 flex-wrap'>
            <TextField
              select
              label='Category'
              value={filterCategoryId}
              onChange={e => {
                setFilterCategoryId(e.target.value)
                setPaginationModel(prev => ({ ...prev, page: 0 }))
              }}
              sx={{ minWidth: 200 }}
              size='small'
            >
              <MenuItem value=''>All Categories</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
            <DatePicker
              label='Start Date'
              value={filterStartDate}
              onChange={date => {
                setFilterStartDate(date)
                setPaginationModel(prev => ({ ...prev, page: 0 }))
              }}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
            />
            <DatePicker
              label='End Date'
              value={filterEndDate}
              onChange={date => {
                setFilterEndDate(date)
                setPaginationModel(prev => ({ ...prev, page: 0 }))
              }}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
            />
            <Button
              variant='outlined'
              onClick={() => {
                setFilterCategoryId('')
                setFilterStartDate(null)
                setFilterEndDate(null)
                setPaginationModel(prev => ({ ...prev, page: 0 }))
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Data Grid Card */}
        <Card>
          <CardHeader title='All Expenses' />
          <DataGrid
            rows={expenses}
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

        {/* Create Expense Dialog */}
        <Dialog open={createDialogOpen} onClose={handleCreateCancel} maxWidth='sm' fullWidth>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogContent>
            {createError && (
              <Alert severity='error' className='mb-4'>
                {createError}
              </Alert>
            )}
            <div className='flex flex-col gap-4 mt-4'>
              <TextField
                label='Amount'
                type='number'
                value={newExpense.amount}
                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                fullWidth
                required
                autoFocus
              />
              <DatePicker
                label='Date'
                value={newExpense.date}
                onChange={date => setNewExpense({ ...newExpense, date: date || new Date() })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
              <TextField
                select
                label='Category'
                value={newExpense.categoryId}
                onChange={e => setNewExpense({ ...newExpense, categoryId: e.target.value })}
                fullWidth
                required
              >
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label='Description'
                value={newExpense.description}
                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                select
                label='Payment Method'
                value={newExpense.paymentMethod}
                onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                fullWidth
                required
              >
                {PAYMENT_METHODS.map(method => (
                  <MenuItem key={method} value={method}>
                    {method.toUpperCase()}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label='Reference'
                value={newExpense.reference}
                onChange={e => setNewExpense({ ...newExpense, reference: e.target.value })}
                fullWidth
                placeholder='Invoice #, Receipt #, etc.'
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
    </LocalizationProvider>
  )
}

export default ExpensesPage
