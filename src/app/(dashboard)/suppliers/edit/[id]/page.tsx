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

  return <SupplierForm mode='edit' supplier={supplier} />
}
