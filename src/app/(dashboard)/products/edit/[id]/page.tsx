import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db/client'
import ProductForm from '@/components/products/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id }
  })

  if (!product) {
    notFound()
  }

  return (
    <ProductForm
      mode='edit'
      product={{
        id: product.id,
        productCode: product.productCode,
        productName: product.productName,
        price: product.price ? parseFloat(product.price.toString()) : null
      }}
    />
  )
}
