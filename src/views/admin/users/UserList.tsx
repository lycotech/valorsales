'use client'

/**
 * User List Component
 * DataGrid table for displaying and managing users
 */

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardHeader,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

import type { User } from '@/types/userTypes'

interface UserListProps {
  users: User[]
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
}

export default function UserList({ users, onDelete, isLoading }: UserListProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10
  })

  const handleEdit = (id: string) => {
    router.push(`/admin/users/${id}/edit`)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      await onDelete(userToDelete.id)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      sales: 'Sales Officer',
      procurement: 'Procurement Officer',
      management: 'Management'
    }

    return roleMap[role] || role
  }

  const getRoleColor = (role: string): 'primary' | 'success' | 'warning' | 'info' => {
    const colorMap: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
      admin: 'primary',
      sales: 'success',
      procurement: 'warning',
      management: 'info'
    }

    return colorMap[role] || 'info'
  }

  const columns: GridColDef<User>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 250
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 180,
      renderCell: (params) => (
        <Chip label={getRoleLabel(params.value as string)} color={getRoleColor(params.value as string)} size='small' />
      )
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size='small'
        />
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      valueFormatter: (value) => {
        return new Date(value as string).toLocaleDateString()
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <div>
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => handleEdit(params.row.id)}>
              <EditIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => handleDeleteClick(params.row)}>
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </div>
      )
    }
  ]

  return (
    <>
      <Card>
        <CardHeader
          title='Users'
          action={
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/users/create')}
            >
              Add User
            </Button>
          }
        />
        <DataGrid
          rows={users}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
          autoHeight
        />
      </Card>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user &quot;{userToDelete?.name}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
