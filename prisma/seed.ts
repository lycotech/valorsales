import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({})

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'admin',
      isActive: true
    }
  })
  console.log('✅ Admin user created:', admin.email)

  // Create sales officer
  const salesPassword = await bcrypt.hash('sales123', 10)
  const salesOfficer = await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: {},
    create: {
      email: 'sales@example.com',
      password: salesPassword,
      name: 'Sales Officer',
      role: 'sales',
      isActive: true
    }
  })
  console.log('✅ Sales officer created:', salesOfficer.email)

  // Create procurement officer
  const procurementPassword = await bcrypt.hash('procurement123', 10)
  const procurementOfficer = await prisma.user.upsert({
    where: { email: 'procurement@example.com' },
    update: {},
    create: {
      email: 'procurement@example.com',
      password: procurementPassword,
      name: 'Procurement Officer',
      role: 'procurement',
      isActive: true
    }
  })
  console.log('✅ Procurement officer created:', procurementOfficer.email)

  // Create management user
  const managementPassword = await bcrypt.hash('management123', 10)
  const management = await prisma.user.upsert({
    where: { email: 'management@example.com' },
    update: {},
    create: {
      email: 'management@example.com',
      password: managementPassword,
      name: 'Management User',
      role: 'management',
      isActive: true
    }
  })
  console.log('✅ Management user created:', management.email)

  console.log('\n📊 Seed Summary:')
  console.log('================')
  console.log('Users created: 4')
  console.log('\n🔐 Login Credentials:')
  console.log('--------------------')
  console.log('Admin:        admin@example.com / admin123')
  console.log('Sales:        sales@example.com / sales123')
  console.log('Procurement:  procurement@example.com / procurement123')
  console.log('Management:   management@example.com / management123')
  console.log('\n✨ Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

