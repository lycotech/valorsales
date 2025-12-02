import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db/client'
import RawMaterialForm from '@/components/raw-materials/RawMaterialForm'

export default async function EditRawMaterialPage({ params }: { params: { id: string } }) {
  const rawMaterial = await prisma.rawMaterial.findUnique({
    where: { id: params.id }
  })

  if (!rawMaterial) {
    notFound()
  }

  return (
    <RawMaterialForm
      mode='edit'
      rawMaterial={{
        id: rawMaterial.id,
        materialCode: rawMaterial.materialCode,
        materialName: rawMaterial.materialName
      }}
    />
  )
}
