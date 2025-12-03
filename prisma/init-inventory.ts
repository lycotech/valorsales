/**
 * Initialize Inventory Records
 * Run this script to create inventory records for all existing products and raw materials
 * Usage: npx tsx prisma/init-inventory.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initializeInventory() {
  try {
    console.log('🚀 Starting inventory initialization...\n')

    // Initialize Product Inventory
    console.log('📦 Initializing product inventory...')
    const products = await prisma.product.findMany()

    let productsInitialized = 0
    let productsSkipped = 0

    for (const product of products) {
      const existing = await prisma.productInventory.findUnique({
        where: { productId: product.id }
      })

      if (existing) {
        console.log(`⏭️  Skipped: ${product.productName} (already has inventory)`)
        productsSkipped++
        continue
      }

      await prisma.productInventory.create({
        data: {
          productId: product.id,
          quantity: 0,
          minimumStock: 10,
          maximumStock: 1000,
          reorderPoint: 20,
          unit: 'pcs'
        }
      })

      console.log(`✅ Created: ${product.productName} - Initial stock: 0 pcs`)
      productsInitialized++
    }

    console.log(`\n📊 Product Inventory Summary:`)
    console.log(`   - Initialized: ${productsInitialized}`)
    console.log(`   - Skipped: ${productsSkipped}`)
    console.log(`   - Total: ${products.length}\n`)

    // Initialize Raw Material Inventory
    console.log('🧱 Initializing raw material inventory...')
    const rawMaterials = await prisma.rawMaterial.findMany()

    let materialsInitialized = 0
    let materialsSkipped = 0

    for (const material of rawMaterials) {
      const existing = await prisma.rawMaterialInventory.findUnique({
        where: { rawMaterialId: material.id }
      })

      if (existing) {
        console.log(`⏭️  Skipped: ${material.materialName} (already has inventory)`)
        materialsSkipped++
        continue
      }

      await prisma.rawMaterialInventory.create({
        data: {
          rawMaterialId: material.id,
          quantity: 0,
          minimumStock: 50,
          maximumStock: 5000,
          reorderPoint: 100,
          unit: 'kg'
        }
      })

      console.log(`✅ Created: ${material.materialName} - Initial stock: 0 kg`)
      materialsInitialized++
    }

    console.log(`\n📊 Raw Material Inventory Summary:`)
    console.log(`   - Initialized: ${materialsInitialized}`)
    console.log(`   - Skipped: ${materialsSkipped}`)
    console.log(`   - Total: ${rawMaterials.length}\n`)

    console.log('✨ Inventory initialization completed successfully!')
  } catch (error) {
    console.error('❌ Error initializing inventory:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

initializeInventory()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
