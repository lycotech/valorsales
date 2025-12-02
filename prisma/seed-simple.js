// Simple seed script using raw SQL to bypass Prisma 7 issues
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Westgate@123',
    database: 'valorsales_db'
  });

  console.log('🌱 Starting database seeding...');

  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const salesPassword = await bcrypt.hash('sales123', 10);
    const procurementPassword = await bcrypt.hash('procurement123', 10);
    const managementPassword = await bcrypt.hash('management123', 10);

    // Generate UUIDs
    const [uuids] = await connection.query('SELECT UUID() as id1, UUID() as id2, UUID() as id3, UUID() as id4');
    const { id1, id2, id3, id4 } = uuids[0];

    // Insert users
    await connection.query(`
      INSERT INTO \`users\` (id, email, password, name, role, isActive, createdAt, updatedAt)
      VALUES
        (?, 'admin@example.com', ?, 'System Admin', 'admin', 1, NOW(), NOW()),
        (?, 'sales@example.com', ?, 'Sales Officer', 'sales', 1, NOW(), NOW()),
        (?, 'procurement@example.com', ?, 'Procurement Officer', 'procurement', 1, NOW(), NOW()),
        (?, 'management@example.com', ?, 'Management User', 'management', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `, [id1, adminPassword, id2, salesPassword, id3, procurementPassword, id4, managementPassword]);

    console.log('✅ Created 4 test users:');
    console.log('   - admin@example.com / admin123');
    console.log('   - sales@example.com / sales123');
    console.log('   - procurement@example.com / procurement123');
    console.log('   - management@example.com / management123');
    console.log('');
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
