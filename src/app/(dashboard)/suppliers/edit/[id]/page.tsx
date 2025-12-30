import { notFound } from 'next/navigation'

import prisma from '@/lib/db/client'
import SupplierForm from '@/components/suppliers/SupplierForm'

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      items: true
    }
  })

  if (!supplier) {
    notFound()
  }

  // Normalize null values to empty strings to prevent hydration mismatches
  const normalizedSupplier = {
    ...supplier,
    otherPhone: supplier.otherPhone ?? ''
  }

  return <SupplierForm mode='edit' supplier={normalizedSupplier} />
}
