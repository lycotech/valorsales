# **QUICK START GUIDE**

## Getting Started with Development

---

## **Prerequisites**

Before starting development, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm/pnpm package manager
- ✅ Database system (PostgreSQL, MySQL, or MongoDB)
- ✅ Code editor (VS Code recommended)
- ✅ Git for version control

---

## **STEP 1: Install Additional Dependencies**

Run the following command to install required packages:

```bash
npm install react-hook-form zod @hookform/resolvers date-fns prisma @prisma/client bcryptjs jsonwebtoken next-auth
```

### Development Dependencies

```bash
npm install -D @types/bcryptjs @types/jsonwebtoken prisma
```

### Optional (for reports and exports)

```bash
npm install jspdf xlsx chart.js react-chartjs-2
npm install -D @types/jspdf
```

---

## **STEP 2: Set Up Environment Variables**

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/inventory_db"
# or for MySQL
# DATABASE_URL="mysql://user:password@localhost:3306/inventory_db"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# JWT
JWT_SECRET=your-jwt-secret-key-here

# App Configuration
NEXT_PUBLIC_APP_NAME="Inventory Management System"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Email Configuration (for notifications)
EMAIL_SERVER=smtp://user@example.com:password@smtp.example.com:587
EMAIL_FROM=noreply@yourdomain.com

# Optional: File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Optional: API Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
```

Create `.env.example` (template for team members):

```env
DATABASE_URL=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
JWT_SECRET=
NEXT_PUBLIC_APP_NAME="Inventory Management System"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## **STEP 3: Set Up Database**

### Option A: Using Prisma (Recommended)

1. **Initialize Prisma:**

```bash
npx prisma init
```

2. **Create Schema** in `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "mysql" or "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      String   // 'admin', 'sales', 'procurement', 'management'
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Customer {
  id              String   @id @default(uuid())
  customerCode    String   @unique
  businessName    String
  address         String
  phone           String
  location        String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  sales           Sale[]

  @@map("customers")
}

model Supplier {
  id           String         @id @default(uuid())
  supplierCode String         @unique
  name         String
  address      String
  phone        String
  location     String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  items        SupplierItem[]
  purchases    Purchase[]

  @@map("suppliers")
}

model SupplierItem {
  id         String   @id @default(uuid())
  itemCode   String   @unique
  itemName   String
  supplierId String
  supplier   Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("supplier_items")
}

model Product {
  id          String   @id @default(uuid())
  productCode String   @unique
  productName String
  price       Float?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  sales       Sale[]

  @@map("products")
}

model RawMaterial {
  id              String     @id @default(uuid())
  materialCode    String     @unique
  materialName    String
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  purchases       Purchase[]

  @@map("raw_materials")
}

model Sale {
  id            String         @id @default(uuid())
  customerId    String
  customer      Customer       @relation(fields: [customerId], references: [id])
  productId     String
  product       Product        @relation(fields: [productId], references: [id])
  quantity      Float
  price         Float
  total         Float
  supplyDate    DateTime
  paymentMode   String         // 'cash', 'transfer', 'pos', 'credit', 'others'
  amountPaid    Float
  balance       Float
  paymentDate   DateTime?
  status        String         @default("pending") // 'pending', 'partial', 'paid'
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  payments      SalePayment[]

  @@map("sales")
}

model SalePayment {
  id            String   @id @default(uuid())
  saleId        String
  sale          Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  amount        Float
  paymentDate   DateTime
  paymentMode   String
  notes         String?
  createdAt     DateTime @default(now())

  @@map("sale_payments")
}

model Purchase {
  id              String            @id @default(uuid())
  supplierId      String
  supplier        Supplier          @relation(fields: [supplierId], references: [id])
  rawMaterialId   String
  rawMaterial     RawMaterial       @relation(fields: [rawMaterialId], references: [id])
  quantity        Float
  totalAmount     Float
  amountPaid      Float
  balance         Float
  purchaseDate    DateTime
  status          String            @default("pending") // 'pending', 'partial', 'paid'
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  payments        PurchasePayment[]

  @@map("purchases")
}

model PurchasePayment {
  id            String   @id @default(uuid())
  purchaseId    String
  purchase      Purchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  amount        Float
  paymentDate   DateTime
  paymentMode   String
  notes         String?
  createdAt     DateTime @default(now())

  @@map("purchase_payments")
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  action     String   // 'create', 'update', 'delete'
  entity     String   // 'customer', 'sale', etc.
  entityId   String
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@map("audit_logs")
}
```

3. **Generate Prisma Client:**

```bash
npx prisma generate
```

4. **Create and Run Migrations:**

```bash
npx prisma migrate dev --name init
```

5. **Create Seed File** (`prisma/seed.ts`):

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'admin',
      isActive: true
    }
  })

  console.log('Seed data created successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

6. **Update package.json:**

Add to scripts:

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:studio": "prisma studio"
  }
}
```

7. **Run Seed:**

```bash
npm run prisma:seed
```

---

## **STEP 4: Create Core Type Definitions**

Create `src/types/index.ts`:

```typescript
// User Types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'sales' | 'procurement' | 'management'
  isActive: boolean
}

export interface Session {
  user: User
  token: string
}

// Customer Types
export interface Customer {
  id: string
  customerCode: string
  businessName: string
  address: string
  phone: string
  location: string
  createdAt: Date
  updatedAt: Date
}

// Supplier Types
export interface Supplier {
  id: string
  supplierCode: string
  name: string
  address: string
  phone: string
  location: string
  items?: SupplierItem[]
  createdAt: Date
  updatedAt: Date
}

export interface SupplierItem {
  id: string
  itemCode: string
  itemName: string
  supplierId: string
}

// Product Types
export interface Product {
  id: string
  productCode: string
  productName: string
  price?: number
  createdAt: Date
  updatedAt: Date
}

// Raw Material Types
export interface RawMaterial {
  id: string
  materialCode: string
  materialName: string
  createdAt: Date
  updatedAt: Date
}

// Sales Types
export interface Sale {
  id: string
  customerId: string
  customer?: Customer
  productId: string
  product?: Product
  quantity: number
  price: number
  total: number
  supplyDate: Date
  paymentMode: 'cash' | 'transfer' | 'pos' | 'credit' | 'others'
  amountPaid: number
  balance: number
  paymentDate?: Date
  status: 'pending' | 'partial' | 'paid'
  payments?: SalePayment[]
  createdAt: Date
  updatedAt: Date
}

export interface SalePayment {
  id: string
  saleId: string
  amount: number
  paymentDate: Date
  paymentMode: string
  notes?: string
  createdAt: Date
}

// Purchase Types
export interface Purchase {
  id: string
  supplierId: string
  supplier?: Supplier
  rawMaterialId: string
  rawMaterial?: RawMaterial
  quantity: number
  totalAmount: number
  amountPaid: number
  balance: number
  purchaseDate: Date
  status: 'pending' | 'partial' | 'paid'
  payments?: PurchasePayment[]
  createdAt: Date
  updatedAt: Date
}

export interface PurchasePayment {
  id: string
  purchaseId: string
  amount: number
  paymentDate: Date
  paymentMode: string
  notes?: string
  createdAt: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

---

## **STEP 5: Create Database Client**

Create `src/lib/db/client.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

---

## **STEP 6: Create Utility Functions**

Create `src/utils/codeGenerator.ts`:

```typescript
/**
 * Generate unique codes for entities
 */

export function generateCustomerCode(count: number): string {
  const prefix = 'CUST'
  const number = String(count + 1).padStart(6, '0')
  return `${prefix}${number}`
}

export function generateSupplierCode(count: number): string {
  const prefix = 'SUPP'
  const number = String(count + 1).padStart(6, '0')
  return `${prefix}${number}`
}

export function generateProductCode(count: number): string {
  const prefix = 'PROD'
  const number = String(count + 1).padStart(6, '0')
  return `${prefix}${number}`
}

export function generateRawMaterialCode(count: number): string {
  const prefix = 'RAW'
  const number = String(count + 1).padStart(6, '0')
  return `${prefix}${number}`
}

export function generateItemCode(count: number): string {
  const prefix = 'ITEM'
  const number = String(count + 1).padStart(6, '0')
  return `${prefix}${number}`
}
```

Create `src/utils/calculations.ts`:

```typescript
/**
 * Business calculation utilities
 */

export function calculateTotal(quantity: number, price: number): number {
  return quantity * price
}

export function calculateBalance(total: number, amountPaid: number): number {
  return Math.max(0, total - amountPaid)
}

export function getPaymentStatus(total: number, amountPaid: number): 'pending' | 'partial' | 'paid' {
  if (amountPaid === 0) return 'pending'
  if (amountPaid >= total) return 'paid'
  return 'partial'
}
```

Create `src/utils/formatters/currency.ts`:

```typescript
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency
  }).format(amount)
}
```

---

## **STEP 7: Update Navigation Menu**

Update `src/data/navigation/verticalMenuData.tsx`:

```typescript
import type { VerticalMenuDataType } from '@/types/menuTypes'

const verticalMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Dashboard',
    href: '/home',
    icon: 'ri-home-smile-line'
  },
  {
    label: 'Main Menu',
    isSection: true
  },
  {
    label: 'Customers',
    href: '/customers',
    icon: 'ri-group-line'
  },
  {
    label: 'Suppliers',
    href: '/suppliers',
    icon: 'ri-building-line'
  },
  {
    label: 'Products',
    href: '/products',
    icon: 'ri-box-line'
  },
  {
    label: 'Raw Materials',
    href: '/raw-materials',
    icon: 'ri-test-tube-line'
  },
  {
    label: 'Transactions',
    isSection: true
  },
  {
    label: 'Sales',
    icon: 'ri-money-dollar-circle-line',
    children: [
      {
        label: 'New Sale',
        href: '/sales/new'
      },
      {
        label: 'Sales List',
        href: '/sales'
      },
      {
        label: 'Outstanding Payments',
        href: '/sales/outstanding'
      }
    ]
  },
  {
    label: 'Purchases',
    icon: 'ri-shopping-cart-line',
    children: [
      {
        label: 'New Purchase',
        href: '/purchases/new'
      },
      {
        label: 'Purchase List',
        href: '/purchases'
      },
      {
        label: 'Outstanding Payables',
        href: '/purchases/payables'
      }
    ]
  },
  {
    label: 'Reports',
    isSection: true
  },
  {
    label: 'Reports',
    icon: 'ri-file-chart-line',
    children: [
      {
        label: 'Customer List',
        href: '/reports/customers'
      },
      {
        label: 'Supplier List',
        href: '/reports/suppliers'
      },
      {
        label: 'Outstanding Receivables',
        href: '/reports/outstanding-receivables'
      },
      {
        label: 'Outstanding Payables',
        href: '/reports/outstanding-payables'
      },
      {
        label: 'Sales by Product',
        href: '/reports/sales-by-product'
      },
      {
        label: 'Total Sales',
        href: '/reports/total-sales'
      }
    ]
  }
]

export default verticalMenuData
```

---

## **STEP 8: Test the Setup**

1. **Start the development server:**

```bash
npm run dev
```

2. **Open Prisma Studio (optional):**

```bash
npm run prisma:studio
```

3. **Verify:**
   - [ ] Application loads at `http://localhost:3000`
   - [ ] Database connection works
   - [ ] Login page displays
   - [ ] Navigation menu shows

---

## **STEP 9: First Development Task - Customer Module**

Now you're ready to start building! Begin with the Customer module:

1. Create API routes: `/app/api/customers/route.ts`
2. Create customer list page: `/app/(dashboard)/customers/page.tsx`
3. Create customer form: `/app/(dashboard)/customers/new/page.tsx`

Refer to `DEVELOPMENT_WORKFLOW.md` Phase 3, Task 3.1 for detailed steps.

---

## **Common Commands Reference**

```bash
# Development
npm run dev                  # Start dev server
npm run build               # Build for production
npm run start               # Start production server

# Database
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Run migrations
npm run prisma:seed         # Seed database
npm run prisma:studio       # Open Prisma Studio

# Code Quality
npm run lint                # Run ESLint
npm run lint:fix            # Fix ESLint errors
npm run format              # Format code with Prettier

# Icons
npm run build:icons         # Build iconify icons
```

---

## **Troubleshooting**

### Database Connection Issues

- Verify DATABASE_URL in `.env.local`
- Ensure database server is running
- Check database credentials

### Prisma Issues

- Run `npx prisma generate` after schema changes
- Clear Prisma cache: `rm -rf node_modules/.prisma`
- Reinstall: `npm install @prisma/client`

### Port Already in Use

- Change port: `npm run dev -- -p 3001`
- Kill process: `npx kill-port 3000`

---

## **Next Steps**

1. ✅ Complete setup steps above
2. 📖 Review `DEVELOPMENT_WORKFLOW.md` for detailed tasks
3. 📁 Review `PROJECT_STRUCTURE.md` for file organization
4. 🏗️ Start building the Customer module (Phase 3, Task 3.1)
5. 🔄 Follow the workflow sequentially

---

## **Support Resources**

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Material-UI Docs:** https://mui.com/
- **React Hook Form:** https://react-hook-form.com/
- **Zod Validation:** https://zod.dev/

---

**Ready to start coding? Begin with Phase 1 of the DEVELOPMENT_WORKFLOW.md!** 🚀

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025
