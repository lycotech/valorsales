import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, Typography, Button, Box, Chip, Grid } from '@mui/material'

import { prisma } from '@/lib/db/client'

export default async function RawMaterialDetailPage({ params }: { params: { id: string } }) {
  const [rawMaterial, purchaseCount] = await Promise.all([
    prisma.rawMaterial.findUnique({
      where: { id: params.id }
    }),
    prisma.purchase.count({
      where: { rawMaterialId: params.id }
    })
  ])

  if (!rawMaterial) {
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
        <Typography variant='h4'>Raw Material Details</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button component={Link} href='/raw-materials' variant='outlined'>
            Back to List
          </Button>
          <Button component={Link} href={`/raw-materials/edit/${rawMaterial.id}`} variant='contained'>
            Edit Raw Material
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ mb: 4 }}>
            <Typography variant='h5' sx={{ mb: 2 }}>
              {rawMaterial.materialName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={rawMaterial.materialCode} color='primary' />
              <Chip label={`${purchaseCount} Purchases`} color='info' variant='tonal' />
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Material Name
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {rawMaterial.materialName}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Material Code
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {rawMaterial.materialCode}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Total Purchases
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {purchaseCount} transactions
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Created At
              </Typography>
              <Typography variant='body1'>{formatDate(rawMaterial.createdAt)}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='text.secondary'>
                Last Updated
              </Typography>
              <Typography variant='body1'>{formatDate(rawMaterial.updatedAt)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
