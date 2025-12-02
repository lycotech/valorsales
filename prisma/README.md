# Prisma Database Schema

## Database: MySQL

### Tables Created (11 total):

1. **users** - System users with roles
2. **customers** - Customer master data
3. **suppliers** - Supplier information
4. **supplier_items** - Items supplied by each supplier
5. **products** - Product catalog
6. **raw_materials** - Raw materials/ingredients
7. **sales** - Sales transactions
8. **sale_payments** - Payment tracking for sales
9. **purchases** - Purchase transactions
10. **purchase_payments** - Payment tracking for purchases
11. **audit_logs** - System audit trail

### Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Seed database (Note: Has Prisma 7 compatibility issues)
npm run prisma:seed

# Reset database (WARNING: Deletes all data)
npm run prisma:reset
```

### Seeding

Due to Prisma 7 compatibility issues with the seed script, you have two options:

#### Option 1: Manual SQL Seed
Run the `manual-seed.sql` file in your MySQL database:
```bash
mysql -u your_username -p your_database < prisma/manual-seed.sql
```

#### Option 2: Create users via Prisma Studio
1. Run `npm run prisma:studio`
2. Navigate to the `users` table
3. Add users manually with bcrypt hashed passwords

#### Option 3: Create users via API
Once authentication is implemented (Task 2.1), you can create users through the API.

### Default Login Credentials (after seeding):

- **Admin:** admin@example.com / admin123
- **Sales:** sales@example.com / sales123
- **Procurement:** procurement@example.com / procurement123
- **Management:** management@example.com / management123

### Schema Status

✅ All tables created successfully
✅ Foreign keys and relationships configured
✅ Indexes created for optimal performance
⚠️ Seed script has Prisma 7 compatibility issues (workarounds available)

### Next Steps

Proceed to Task 1.3: TypeScript Types & Interfaces

