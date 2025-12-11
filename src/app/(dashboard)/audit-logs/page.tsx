'use client'

/**
 * Audit Logs Viewer Page
 * Admin-only view for audit trail
 */

import { useState, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'

import { formatDateTime, formatRelativeTime } from '@/utils/formatters'

interface AuditLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string
  oldValue: Record<string, any> | null
  newValue: Record<string, any> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    name: string
    email: string
  }
}

interface Stats {
  totalLogs: number
  actionCounts: Record<string, number>
  entityCounts: Record<string, number>
}

const ACTION_COLORS: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  login: 'default',
  logout: 'default',
  view: 'default',
  export: 'warning'
}

const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'customer', label: 'Customers' },
  { value: 'product', label: 'Products' },
  { value: 'raw_material', label: 'Raw Materials' },
  { value: 'supplier', label: 'Suppliers' },
  { value: 'sale', label: 'Sales' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'payment', label: 'Payments' },
  { value: 'user', label: 'Users' },
  { value: 'inventory', label: 'Inventory' }
]

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'export', label: 'Export' }
]

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')

  // Dialog state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Fetch audit logs
  const fetchLogs = async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString()
      })

      if (entity) params.append('entity', entity)
      if (action) params.append('action', action)
      if (search) params.append('search', search)

      const response = await fetch(`/api/audit-logs?${params}`)
      const data = await response.json()

      setLogs(data.data || [])
      setTotalCount(data.pagination?.totalCount || 0)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stats' })
      })

      const data = await response.json()

      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [page, rowsPerPage, entity, action])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchLogs()
      } else {
        setPage(0)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Stats */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' variant='overline'>
                  Total Activities (30 days)
                </Typography>
                <Typography variant='h4'>{stats.totalLogs.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' variant='overline'>
                  Creates
                </Typography>
                <Typography variant='h4' color='success.main'>
                  {(stats.actionCounts.create || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' variant='overline'>
                  Updates
                </Typography>
                <Typography variant='h4' color='info.main'>
                  {(stats.actionCounts.update || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary' variant='overline'>
                  Deletes
                </Typography>
                <Typography variant='h4' color='error.main'>
                  {(stats.actionCounts.delete || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title='Audit Logs'
          subheader='View all system activity and changes'
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size='small'
                placeholder='Search...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='ri-search-line' />
                      </InputAdornment>
                    )
                  }
                }}
                sx={{ width: 200 }}
              />
              <TextField
                select
                size='small'
                value={entity}
                onChange={e => setEntity(e.target.value)}
                sx={{ width: 150 }}
              >
                {ENTITY_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size='small'
                value={action}
                onChange={e => setAction(e.target.value)}
                sx={{ width: 150 }}
              >
                {ACTION_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          }
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Entity ID</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell align='center'>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                    <Typography color='text.secondary'>No audit logs found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Tooltip title={formatDateTime(log.createdAt)}>
                        <span>{formatRelativeTime(log.createdAt)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant='body2'>{log.user.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {log.user.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action.toUpperCase()}
                        size='small'
                        color={ACTION_COLORS[log.action] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={log.entity.replace('_', ' ')} size='small' variant='outlined' />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                        {log.entityId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {log.ipAddress || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Tooltip title='View Details'>
                        <IconButton size='small' onClick={() => handleViewDetails(log)}>
                          <i className='ri-eye-line' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component='div'
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Timestamp
                  </Typography>
                  <Typography>{formatDateTime(selectedLog.createdAt)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    User
                  </Typography>
                  <Typography>{selectedLog.user.name}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Action
                  </Typography>
                  <Typography>
                    <Chip
                      label={selectedLog.action.toUpperCase()}
                      size='small'
                      color={ACTION_COLORS[selectedLog.action] || 'default'}
                    />
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Entity
                  </Typography>
                  <Typography>{selectedLog.entity}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Entity ID
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace' }}>{selectedLog.entityId}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    IP Address
                  </Typography>
                  <Typography>{selectedLog.ipAddress || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    User Agent
                  </Typography>
                  <Typography noWrap sx={{ maxWidth: 300 }}>
                    {selectedLog.userAgent || '-'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Old Value */}
              {selectedLog.oldValue && (
                <Box>
                  <Typography variant='subtitle2' color='error.main' gutterBottom>
                    Previous Value
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: 'error.lighter',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 200
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                      {JSON.stringify(selectedLog.oldValue, null, 2)}
                    </pre>
                  </Box>
                </Box>
              )}

              {/* New Value */}
              {selectedLog.newValue && (
                <Box>
                  <Typography variant='subtitle2' color='success.main' gutterBottom>
                    New Value
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: 'success.lighter',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 200
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                      {JSON.stringify(selectedLog.newValue, null, 2)}
                    </pre>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
