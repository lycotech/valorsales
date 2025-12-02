'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid'

export default function RawMaterialsPage() {
  const router = useRouter()
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
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
    materialId: string | null
    materialName: string | null
  }>({
    open: false,
    materialId: null,
    materialName: null
  })

  const fetchRawMaterials = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        pageSize: paginationModel.pageSize.toString(),
        search
      })

      const response = await fetch(`/api/raw-materials?${params}`)
      const data = await response.json()

      if (data.success) {
        setRawMaterials(data.data)
        setRowCount(data.pagination.totalCount)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch raw materials')
      }
    } catch (err) {
      setError('Failed to fetch raw materials')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRawMaterials()
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, paginationModel])

  const handleDelete = async () => {
    if (!deleteDialog.materialId) return

    try {
      const response = await fetch(`/api/raw-materials/${deleteDialog.materialId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchRawMaterials()
        setDeleteDialog({ open: false, materialId: null, materialName: null })
      } else {
        alert(data.message || data.error || 'Failed to delete raw material')
      }
    } catch (err) {
      alert('Failed to delete raw material')
      console.error(err)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'materialCode',
      headerName: 'Material Code',
      width: 140,
      renderCell: params => (
        <Link href={`/raw-materials/${params.row.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography
            variant='body2'
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {params.value}
          </Typography>
        </Link>
      )
    },
    {
      field: 'materialName',
      headerName: 'Material Name',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'purchaseCount',
      headerName: 'Purchases',
      width: 120,
      renderCell: params => <Chip label={params.value || 0} size='small' color='primary' variant='tonal' />
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' color='primary' onClick={() => router.push(`/raw-materials/${params.row.id}`)}>
            <i className='ri-eye-line' />
          </IconButton>
          <IconButton size='small' color='secondary' onClick={() => router.push(`/raw-materials/edit/${params.row.id}`)}>
            <i className='ri-edit-line' />
          </IconButton>
          <IconButton
            size='small'
            color='error'
            onClick={() =>
              setDeleteDialog({
                open: true,
                materialId: params.row.id,
                materialName: params.row.materialName
              })
            }
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
          <Typography variant='h4'>Raw Materials</Typography>
          <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={() => router.push('/raw-materials/new')}>
            Add Raw Material
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder='Search by material name or code...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box component='i' className='ri-search-line' sx={{ mr: 2 }} />
              )
            }}
          />
        </Box>

        {error && (
          <Typography color='error' sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <DataGrid
          rows={rawMaterials}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          paginationMode='server'
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
          autoHeight
        />
      </CardContent>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, materialId: null, materialName: null })}>
        <DialogTitle>Delete Raw Material</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the raw material &ldquo;{deleteDialog.materialName}&rdquo;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, materialId: null, materialName: null })}>Cancel</Button>
          <Button onClick={handleDelete} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
