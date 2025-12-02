/**
 * Customer Detail Page (View)
 * Page for viewing customer details
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import EditIcon from '@mui/icons-material/Edit'

import prisma from '@/lib/db/client'

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>
}

const CustomerDetailPage = async ({ params }: CustomerDetailPageProps) => {
  const { id } = await params

  // Fetch customer with sales count
  const [customer, salesCount] = await Promise.all([
    prisma.customer.findUnique({
      where: { id }
    }),
    prisma.sale.count({
      where: { customerId: id }
    })
  ])

  if (!customer) {
    notFound()
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Customer Details</h1>
          <p className='text-textSecondary'>View customer information</p>
        </div>
        <div className='flex gap-2'>
          <Link href='/customers'>
            <Button variant='outlined'>Back to List</Button>
          </Link>
          <Link href={`/customers/edit/${customer.id}`}>
            <Button variant='contained' startIcon={<EditIcon />}>
              Edit Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader
          title='Customer Information'
          subheader={
            <div className='flex gap-2 mt-2'>
              <Chip label={customer.customerCode} color='primary' size='small' />
              <Chip label={`${salesCount} Sales`} variant='outlined' size='small' />
            </div>
          }
        />
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-textSecondary'>Business Name</span>
                <span className='font-medium'>{customer.businessName}</span>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-textSecondary'>Phone Number</span>
                <span className='font-medium'>{customer.phone}</span>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-textSecondary'>Location</span>
                <span className='font-medium'>{customer.location}</span>
              </div>
            </Grid>

            <Grid item xs={12}>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-textSecondary'>Address</span>
                <span className='font-medium whitespace-pre-wrap'>{customer.address}</span>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-textSecondary'>Created Date</span>
                <span className='font-medium'>{formatDate(customer.createdAt)}</span>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-textSecondary'>Last Updated</span>
                <span className='font-medium'>{formatDate(customer.updatedAt)}</span>
              </div>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerDetailPage
