import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card, CardContent, Typography, Button, Box, Grid, Chip, Paper, Divider } from '@mui/material'

import prisma from '@/lib/db/client'

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [supplier, purchaseCount] = await Promise.all([
    prisma.supplier.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        }
      }
    }),
    prisma.purchase.count({
      where: { supplierId: id }
    })
  ])

  if (!supplier) {
    notFound()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant='h4'>{supplier.name}</Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Chip label={supplier.supplierCode} color='primary' />
                <Chip label={`${supplier.items.length} Items`} color='secondary' variant='tonal' />
                <Chip label={`${purchaseCount} Purchases`} color='info' variant='tonal' />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link href='/suppliers'>
                <Button variant='outlined'>
                  Back to List
                </Button>
              </Link>
              <Link href={`/suppliers/edit/${supplier.id}`}>
                <Button variant='contained'>
                  Edit Supplier
                </Button>
              </Link>
            </Box>
          </Box>

          <Typography variant='h6' sx={{ mb: 2 }}>
            Supplier Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Supplier Name
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {supplier.name}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Phone
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {supplier.phone}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Location
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {supplier.location}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Address
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                {supplier.address}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Created At
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {new Intl.DateTimeFormat('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                }).format(new Date(supplier.createdAt))}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Last Updated
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {new Intl.DateTimeFormat('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                }).format(new Date(supplier.updatedAt))}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant='h6'>Supplier Items ({supplier.items.length})</Typography>
          </Box>

          {supplier.items.length > 0 ? (
            <Grid container spacing={2}>
              {supplier.items.map(item => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <Typography variant='body2' color='text.secondary'>
                      {item.itemCode}
                    </Typography>
                    <Typography variant='body1' sx={{ fontWeight: 500 }}>
                      {item.itemName}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              No items associated with this supplier.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
