'use client'

/**
 * Customer Credit Balances Page
 * Shows customers with credit balances that can be used for future sales
 */

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Grid
} from '@mui/material'

type CustomerCredit = {
  id: string
  customerCode: string
  businessName: string
  phone: string
  location: string
  creditBalance: number
}

export default function CustomerCreditsPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCredits, setTotalCredits] = useState(0)

  const fetchCustomers = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/customers/credits?search=${encodeURIComponent(search)}`)
      const result = await response.json()

      if (result.success) {
        setCustomers(result.data)
        setTotalCredits(result.totalCredits || 0)
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const paginatedCustomers = customers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant='h4' gutterBottom>
          Customer Credit Balances
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          View customers with available credit from excess payments
        </Typography>
      </Box>

      {error && (
        <Box mb={3}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Summary Card */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant='caption' sx={{ opacity: 0.8 }}>
                Total Credit Balance
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                ₦{totalCredits.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant='caption' sx={{ opacity: 0.8 }}>
                {customers.length} customer(s) with credit
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            label='Search Customers'
            placeholder='Search by name, code, phone...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            size='small'
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-search-line' />
                </InputAdornment>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer Code</TableCell>
                <TableCell>Business Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align='right'>Credit Balance</TableCell>
                <TableCell align='center'>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    <Typography variant='body2' color='text.secondary' py={4}>
                      No customers with credit balance found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map(customer => (
                  <TableRow
                    key={customer.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>
                        {customer.customerCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{customer.businessName}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.location}</TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' fontWeight={600} color='success.main'>
                        ₦{customer.creditBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label='Has Credit'
                        color='success'
                        size='small'
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component='div'
          count={customers.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>
    </Box>
  )
}
