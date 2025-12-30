import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, Typography, Button, Box, Chip, Grid } from '@mui/material'

import { prisma } from '@/lib/db/client'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [product, salesCount] = await Promise.all([
    prisma.product.findUnique({
      where: { id }
    }),
    prisma.sale.count({
      where: { productId: id }
    })
  ])

  if (!product) {
    notFound()
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant='h4'>Product Details</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href='/products'>
            <Button variant='outlined'>
              Back to List
            </Button>
          </Link>
          <Link href={`/products/edit/${product.id}`}>
            <Button variant='contained'>
              Edit Product
            </Button>
          </Link>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ mb: 4 }}>
            <Typography variant='h5' sx={{ mb: 2 }}>
              {product.productName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={product.productCode} color='primary' />
              <Chip label={`${salesCount} Sales`} color='info' variant='tonal' />
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Product Name
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {product.productName}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Product Code
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {product.productCode}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Price
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {product.price ? `₦${parseFloat(product.price.toString()).toLocaleString()}` : 'Not set'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Total Sales
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {salesCount} transactions
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Created At
              </Typography>
              <Typography variant='body1'>{formatDate(product.createdAt)}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Last Updated
              </Typography>
              <Typography variant='body1'>{formatDate(product.updatedAt)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
