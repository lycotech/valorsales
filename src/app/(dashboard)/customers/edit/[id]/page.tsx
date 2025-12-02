/**
 * Edit Customer Page
 * Page for editing an existing customer
 */

import { notFound } from 'next/navigation'

import prisma from '@/lib/db/client'
import CustomerForm from '@/components/customers/CustomerForm'

type EditCustomerPageProps = {
  params: Promise<{ id: string }>
}

const EditCustomerPage = async ({ params }: EditCustomerPageProps) => {
  const { id } = await params

  // Fetch customer
  const customer = await prisma.customer.findUnique({
    where: { id }
  })

  if (!customer) {
    notFound()
  }

  return <CustomerForm mode='edit' customer={customer} />
}

export default EditCustomerPage
