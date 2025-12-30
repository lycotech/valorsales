import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db/client'
import RawMaterialForm from '@/components/raw-materials/RawMaterialForm'

export default async function EditRawMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [rawMaterial, inventory] = await Promise.all([
    prisma.rawMaterial.findUnique({
      where: { id }
    }),
    prisma.rawMaterialInventory.findUnique({
      where: { rawMaterialId: id }
    })
  ])

  if (!rawMaterial) {
    notFound()
  }

  return (
    <RawMaterialForm
      mode='edit'
      rawMaterial={{
        id: rawMaterial.id,
        materialCode: rawMaterial.materialCode,
        materialName: rawMaterial.materialName,
        inventory: inventory
          ? {
              minimumStock: Number(inventory.minimumStock),
              maximumStock: inventory.maximumStock ? Number(inventory.maximumStock) : null,
              reorderPoint: Number(inventory.reorderPoint),
              unit: inventory.unit
            }
          : undefined
      }}
    />
  )
}
