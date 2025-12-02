# **PROJECT STRUCTURE GUIDE**

## Inventory, Sales & Supplier Management System

---

## **Recommended Folder Structure**

```
UDY/
├── public/
│   └── images/
│       └── (existing starter theme assets)
│
├── src/
│   ├── @core/                          # Core theme components (existing)
│   ├── @layouts/                       # Layout components (existing)
│   ├── @menu/                          # Menu components (existing)
│   │
│   ├── app/
│   │   ├── (blank-layout-pages)/
│   │   │   └── login/                  # ✅ Existing login page
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── home/                   # 🔨 To Update - Dashboard
│   │   │   │
│   │   │   ├── customers/              # 🆕 NEW
│   │   │   │   ├── page.tsx           # List customers
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Add customer
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # View customer
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx   # Edit customer
│   │   │   │
│   │   │   ├── suppliers/              # 🆕 NEW
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── products/               # 🆕 NEW
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── raw-materials/          # 🆕 NEW
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── sales/                  # 🆕 NEW
│   │   │   │   ├── page.tsx           # List sales
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Record new sale
│   │   │   │   ├── outstanding/
│   │   │   │   │   └── page.tsx       # Outstanding customer payments
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # View sale details
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx   # Edit sale
│   │   │   │       └── payment/
│   │   │   │           └── page.tsx   # Record payment
│   │   │   │
│   │   │   ├── purchases/              # 🆕 NEW
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── payables/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── payment/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── reports/                # 🆕 NEW
│   │   │   │   ├── customers/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── suppliers/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── outstanding-receivables/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── outstanding-payables/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── sales-by-product/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── total-sales/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── users/                  # 🆕 NEW (Admin only)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   └── layout.tsx              # ✅ Existing dashboard layout
│   │   │
│   │   ├── api/                        # 🆕 NEW - API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   └── session/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── customers/
│   │   │   │   ├── route.ts           # GET (list), POST (create)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # GET, PUT, DELETE
│   │   │   │
│   │   │   ├── suppliers/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── products/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── raw-materials/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── sales/
│   │   │   │   ├── route.ts
│   │   │   │   ├── outstanding/
│   │   │   │   │   └── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── payment/
│   │   │   │           └── route.ts
│   │   │   │
│   │   │   ├── purchases/
│   │   │   │   ├── route.ts
│   │   │   │   ├── payables/
│   │   │   │   │   └── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── payment/
│   │   │   │           └── route.ts
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── customers/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── suppliers/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── outstanding-receivables/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── outstanding-payables/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── sales-by-product/
│   │   │   │   │   └── route.ts
│   │   │   │   └── total-sales/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   └── users/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           └── route.ts
│   │   │
│   │   └── layout.tsx                  # ✅ Existing root layout
│   │
│   ├── components/                     # Custom components
│   │   ├── forms/                      # 🆕 NEW - Reusable form components
│   │   │   ├── CustomerForm.tsx
│   │   │   ├── SupplierForm.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── RawMaterialForm.tsx
│   │   │   ├── SalesForm.tsx
│   │   │   ├── PurchaseForm.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── SearchableSelect.tsx
│   │   │   └── CurrencyInput.tsx
│   │   │
│   │   ├── tables/                     # 🆕 NEW - Table components
│   │   │   ├── DataTable.tsx
│   │   │   ├── CustomerTable.tsx
│   │   │   ├── SupplierTable.tsx
│   │   │   ├── ProductTable.tsx
│   │   │   ├── SalesTable.tsx
│   │   │   └── PurchaseTable.tsx
│   │   │
│   │   ├── reports/                    # 🆕 NEW - Report components
│   │   │   ├── ReportHeader.tsx
│   │   │   ├── ExportButtons.tsx
│   │   │   └── PrintLayout.tsx
│   │   │
│   │   ├── dashboard/                  # 🆕 NEW - Dashboard widgets
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── SalesChart.tsx
│   │   │   ├── RecentTransactions.tsx
│   │   │   └── QuickActions.tsx
│   │   │
│   │   ├── auth/                       # 🆕 NEW - Auth components
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleGuard.tsx
│   │   │
│   │   ├── layout/                     # ✅ Existing layout components
│   │   └── theme/                      # ✅ Existing theme components
│   │
│   ├── types/                          # TypeScript types
│   │   ├── customerTypes.ts            # 🆕 NEW
│   │   ├── supplierTypes.ts            # 🆕 NEW
│   │   ├── productTypes.ts             # 🆕 NEW
│   │   ├── rawMaterialTypes.ts         # 🆕 NEW
│   │   ├── salesTypes.ts               # 🆕 NEW
│   │   ├── purchaseTypes.ts            # 🆕 NEW
│   │   ├── paymentTypes.ts             # 🆕 NEW
│   │   ├── userTypes.ts                # 🆕 NEW
│   │   ├── reportTypes.ts              # 🆕 NEW
│   │   └── menuTypes.ts                # ✅ Existing
│   │
│   ├── lib/                            # 🆕 NEW - Core libraries
│   │   ├── db/
│   │   │   ├── client.ts              # Database client
│   │   │   ├── migrations/            # Database migrations
│   │   │   └── seed.ts                # Seed data
│   │   │
│   │   ├── auth/
│   │   │   ├── session.ts             # Session management
│   │   │   ├── password.ts            # Password hashing
│   │   │   └── permissions.ts         # Role-based permissions
│   │   │
│   │   └── validation/
│   │       ├── customerSchema.ts      # Zod schemas
│   │       ├── supplierSchema.ts
│   │       ├── productSchema.ts
│   │       ├── salesSchema.ts
│   │       └── purchaseSchema.ts
│   │
│   ├── utils/                          # Utility functions
│   │   ├── api/                        # 🆕 NEW
│   │   │   ├── client.ts              # API client wrapper
│   │   │   ├── errorHandler.ts        # Error handling
│   │   │   └── responseHelper.ts      # API response helpers
│   │   │
│   │   ├── formatters/                 # 🆕 NEW
│   │   │   ├── currency.ts            # Currency formatting
│   │   │   ├── date.ts                # Date formatting
│   │   │   └── number.ts              # Number formatting
│   │   │
│   │   ├── export/                     # 🆕 NEW
│   │   │   ├── pdf.ts                 # PDF generation
│   │   │   └── excel.ts               # Excel generation
│   │   │
│   │   ├── validators/                 # 🆕 NEW
│   │   │   └── index.ts               # Custom validators
│   │   │
│   │   ├── codeGenerator.ts            # 🆕 NEW - Auto-generate codes
│   │   ├── calculations.ts             # 🆕 NEW - Business calculations
│   │   ├── getInitials.ts              # ✅ Existing
│   │   └── string.ts                   # ✅ Existing
│   │
│   ├── hooks/                          # 🆕 NEW - Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   ├── useCustomers.ts
│   │   ├── useSuppliers.ts
│   │   ├── useProducts.ts
│   │   ├── useSales.ts
│   │   ├── usePurchases.ts
│   │   └── useReports.ts
│   │
│   ├── data/
│   │   └── navigation/
│   │       ├── horizontalMenuData.tsx  # 🔨 To Update
│   │       └── verticalMenuData.tsx    # 🔨 To Update
│   │
│   ├── configs/                        # ✅ Existing configurations
│   │
│   ├── assets/                         # ✅ Existing assets
│   │
│   └── views/                          # View components
│       ├── Login.tsx                   # ✅ Existing
│       ├── NotFound.tsx                # ✅ Existing
│       │
│       ├── customers/                  # 🆕 NEW
│       │   ├── CustomerList.tsx
│       │   ├── CustomerDetail.tsx
│       │   └── CustomerFormView.tsx
│       │
│       ├── suppliers/                  # 🆕 NEW
│       │   ├── SupplierList.tsx
│       │   ├── SupplierDetail.tsx
│       │   └── SupplierFormView.tsx
│       │
│       ├── products/                   # 🆕 NEW
│       │   ├── ProductList.tsx
│       │   └── ProductFormView.tsx
│       │
│       ├── raw-materials/              # 🆕 NEW
│       │   ├── RawMaterialList.tsx
│       │   └── RawMaterialFormView.tsx
│       │
│       ├── sales/                      # 🆕 NEW
│       │   ├── SalesList.tsx
│       │   ├── SaleDetail.tsx
│       │   ├── SalesFormView.tsx
│       │   ├── PaymentFormView.tsx
│       │   └── OutstandingList.tsx
│       │
│       ├── purchases/                  # 🆕 NEW
│       │   ├── PurchaseList.tsx
│       │   ├── PurchaseDetail.tsx
│       │   ├── PurchaseFormView.tsx
│       │   ├── PaymentFormView.tsx
│       │   └── PayablesList.tsx
│       │
│       ├── reports/                    # 🆕 NEW
│       │   ├── CustomerReport.tsx
│       │   ├── SupplierReport.tsx
│       │   ├── OutstandingReceivables.tsx
│       │   ├── OutstandingPayables.tsx
│       │   ├── SalesByProduct.tsx
│       │   └── TotalSales.tsx
│       │
│       ├── dashboard/                  # 🆕 NEW
│       │   └── DashboardView.tsx
│       │
│       └── users/                      # 🆕 NEW
│           ├── UserList.tsx
│           └── UserFormView.tsx
│
├── prisma/                             # 🆕 NEW (if using Prisma)
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── .env.local                          # 🔨 To Create - Environment variables
├── .env.example                        # 🆕 NEW - Example env file
├── next.config.ts                      # ✅ Existing
├── package.json                        # ✅ Existing
├── tsconfig.json                       # ✅ Existing
├── tailwind.config.ts                  # ✅ Existing
├── PRD.md                              # ✅ Existing - Product Requirements
├── DEVELOPMENT_WORKFLOW.md             # ✅ Created - Development guide
├── PROJECT_STRUCTURE.md                # ✅ Created - This file
└── README.md                           # ✅ Existing
```

---

## **Legend**

- ✅ **Existing** - Already present in starter theme
- 🆕 **NEW** - To be created during development
- 🔨 **To Update** - Existing file that needs modification

---

## **File Count Summary**

### Existing (From Starter Theme)

- ✅ Authentication: Login page
- ✅ Layout: Dashboard layout with vertical/horizontal navigation
- ✅ Theme: Complete theme system with customization
- ✅ Components: Core UI components (Avatar, Badge, IconButton, etc.)
- ✅ Navigation: Menu system with routing

### To Be Created (New Development)

- 🆕 **6 Main Modules**: Customers, Suppliers, Products, Raw Materials, Sales, Purchases
- 🆕 **6 Report Pages**: Various reports
- 🆕 **API Routes**: ~50+ API endpoints
- 🆕 **Types**: 9 type definition files
- 🆕 **Components**: ~30+ custom components
- 🆕 **Utils**: 10+ utility files
- 🆕 **Hooks**: 8+ custom hooks
- 🆕 **Database**: Schema, migrations, seed data

**Total New Files to Create: ~150-200 files**

---

## **Quick Start Checklist**

### **Immediate Setup (Day 1)**

1. [ ] Create `.env.local` with database credentials
2. [ ] Install additional dependencies (date-fns, react-hook-form, zod, etc.)
3. [ ] Set up database (PostgreSQL/MySQL)
4. [ ] Create database schema
5. [ ] Create basic TypeScript types

### **Week 1 Focus**

1. [ ] Authentication system (replace mock login)
2. [ ] User management
3. [ ] Role-based access control
4. [ ] Customer module (CRUD)

### **Week 2 Focus**

1. [ ] Supplier module
2. [ ] Product module
3. [ ] Raw materials module
4. [ ] Update navigation menu

### **Week 3 Focus**

1. [ ] Sales transaction module
2. [ ] Payment tracking
3. [ ] Credit sales handling

### **Week 4 Focus**

1. [ ] Purchase module
2. [ ] Supplier payments
3. [ ] Payables tracking

### **Week 5-6 Focus**

1. [ ] All 6 report pages
2. [ ] Export functionality (PDF/Excel)
3. [ ] Dashboard with analytics

### **Week 7-8 Focus**

1. [ ] Testing (unit, integration, E2E)
2. [ ] Performance optimization
3. [ ] Security hardening
4. [ ] Documentation

### **Week 9-10 Focus**

1. [ ] Final testing
2. [ ] Bug fixes
3. [ ] Deployment preparation
4. [ ] User training

---

## **Database Tables Overview**

### **Core Tables**

1. **users** - System users with roles
2. **customers** - Customer master data
3. **suppliers** - Supplier master data
4. **products** - Product catalog
5. **raw_materials** - Raw materials/ingredients
6. **supplier_items** - Items supplied by each supplier (many-to-many)

### **Transaction Tables**

7. **sales** - Sales transactions
8. **sales_payments** - Payment tracking for sales
9. **purchases** - Purchase transactions
10. **purchase_payments** - Payment tracking for purchases

### **Audit Tables**

11. **audit_logs** - System audit trail
12. **sessions** - User sessions

---

## **Navigation Menu Structure**

```
Dashboard
├── 📊 Home

Main Menu
├── 👥 Customers
├── 🏢 Suppliers
├── 📦 Products
└── 🧪 Raw Materials

Transactions
├── 💰 Sales
│   ├── New Sale
│   ├── Sales List
│   └── Outstanding Payments
└── 🛒 Purchases
    ├── New Purchase
    ├── Purchase List
    └── Outstanding Payables

Reports
├── 📋 Customer List
├── 📋 Supplier List
├── 💸 Outstanding Receivables
├── 💸 Outstanding Payables
├── 📊 Sales by Product
└── 📊 Total Sales

Settings (Admin Only)
├── 👤 Users
└── ⚙️ System Settings
```

---

## **Next Steps**

1. **Review this structure** with your team
2. **Set up version control** branches for each module
3. **Create project board** with tasks from DEVELOPMENT_WORKFLOW.md
4. **Start with Phase 1** (Project Setup & Configuration)
5. **Build incrementally** following the workflow

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025  
**Related Documents:** DEVELOPMENT_WORKFLOW.md, PRD.md
