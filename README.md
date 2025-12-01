# **Inventory, Sales & Supplier Management System**

A comprehensive web-based system for managing customers, products, suppliers, raw materials, sales transactions, and supplier payments with detailed reporting capabilities.

---

## **📋 Overview**

This project is built using a professional Next.js 15 + Material-UI starter theme and implements a complete inventory management solution as specified in the Product Requirements Document (PRD).

### **Key Features**

- 👥 Customer & Supplier Management
- 📦 Product & Raw Material Catalog
- 💰 Sales Transaction Processing
- 🛒 Purchase & Supplier Payment Tracking
- 📊 Comprehensive Reporting (6 reports)
- 🔐 Role-Based Access Control
- 📱 Responsive Design
- 🌙 Dark/Light Mode
- 📤 Export to PDF/Excel

---

## **🚀 Quick Start**

### **Prerequisites**

- Node.js 18+
- npm/pnpm/yarn
- PostgreSQL/MySQL database

### **Installation**

1. **Clone the repository**

```bash
git clone <repository-url>
cd UDY
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
# Edit .env.local with your database credentials
```

4. **Set up database**

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. **Start development server**

```bash
npm run dev
```

6. **Open in browser**

```
http://localhost:3000
```

**Default Login:**

- Email: `admin@example.com`
- Password: `admin123`

---

## **📚 Documentation**

| Document                                                 | Description                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| **[PRD.md](./PRD.md)**                                   | Product Requirements Document - Complete feature specifications |
| **[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)** | Detailed phase-by-phase development tasks (20 phases)           |
| **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**       | Complete folder structure and file organization                 |
| **[QUICK_START.md](./QUICK_START.md)**                   | Step-by-step setup guide with code examples                     |
| **[DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)**   | 8-week development plan overview                                |

**Start Here:** 👉 [QUICK_START.md](./QUICK_START.md)

---

## **🏗️ Tech Stack**

### **Frontend**

- **Framework:** Next.js 15 (App Router)
- **UI Library:** Material-UI (MUI) v6
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Form Handling:** React Hook Form + Zod
- **State Management:** React Hooks

### **Backend**

- **API Routes:** Next.js API Routes
- **Database ORM:** Prisma
- **Authentication:** NextAuth.js / Custom JWT
- **Validation:** Zod

### **Database**

- **Primary:** PostgreSQL (recommended)
- **Alternative:** MySQL, MongoDB

---

## **📂 Project Structure**

```
UDY/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (dashboard)/       # Dashboard pages
│   │   │   ├── customers/
│   │   │   ├── suppliers/
│   │   │   ├── products/
│   │   │   ├── raw-materials/
│   │   │   ├── sales/
│   │   │   ├── purchases/
│   │   │   └── reports/
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   ├── lib/                   # Core libraries
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utility functions
│   ├── hooks/                 # Custom React hooks
│   └── views/                 # View components
├── prisma/                    # Database schema & migrations
├── public/                    # Static assets
└── [Documentation files]
```

---

## **🎯 Modules**

### **1. Main Menu (Master Data)**

- ✅ Customer Management
- ✅ Supplier Management
- ✅ Product Catalog
- ✅ Raw Materials

### **2. Transactions**

- ✅ Sales Recording & Tracking
- ✅ Credit Sales Management
- ✅ Purchase Recording
- ✅ Supplier Payment Tracking

### **3. Reports**

- ✅ Customer List
- ✅ Supplier List
- ✅ Outstanding Receivables
- ✅ Outstanding Payables
- ✅ Sales by Product
- ✅ Total Sales Report

---

## **👥 User Roles**

| Role                    | Access Level                                          |
| ----------------------- | ----------------------------------------------------- |
| **Admin**               | Full system access, user management, all reports      |
| **Sales Officer**       | Sales, customers, sales reports                       |
| **Procurement Officer** | Purchases, suppliers, raw materials, purchase reports |
| **Management**          | Read-only access to all reports                       |

---

## **🔧 Available Scripts**

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run format          # Format code with Prettier

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database with initial data
npm run prisma:studio    # Open Prisma Studio GUI

# Icons
npm run build:icons      # Build Iconify icons
```

---

## **🗄️ Database Schema**

### **Core Tables**

- `users` - System users and authentication
- `customers` - Customer master data
- `suppliers` - Supplier information
- `supplier_items` - Items supplied by suppliers
- `products` - Product catalog
- `raw_materials` - Raw materials/ingredients

### **Transaction Tables**

- `sales` - Sales transactions
- `sale_payments` - Payment tracking for sales
- `purchases` - Purchase transactions
- `purchase_payments` - Payment tracking for purchases

### **System Tables**

- `audit_logs` - Audit trail
- `sessions` - User sessions

---

## **📈 Development Progress**

### **Phase 1: Setup & Configuration** ⏳

- [x] Project initialization
- [ ] Database setup
- [ ] Environment configuration
- [ ] Type definitions

### **Phase 2: Authentication** ⏳

- [ ] User authentication
- [ ] Role-based access
- [ ] User management

### **Phase 3: Master Data** 📝

- [ ] Customer module
- [ ] Supplier module
- [ ] Product module
- [ ] Raw materials module

### **Phase 4-5: Transactions** 📝

- [ ] Sales module
- [ ] Purchase module

### **Phase 6: Reports** 📝

- [ ] All 6 reports
- [ ] Export functionality

### **Phase 7-8: Polish & Deploy** 📝

- [ ] Dashboard
- [ ] Testing
- [ ] Deployment

---

## **🚧 Current Status**

**Status:** Planning & Documentation Phase Complete ✅

**Next Steps:**

1. Set up database (follow [QUICK_START.md](./QUICK_START.md))
2. Install additional dependencies
3. Create TypeScript types
4. Begin Phase 1: Authentication System

---

## **📖 Development Workflow**

Follow these steps to contribute:

1. **Read Documentation**

   - Start with [QUICK_START.md](./QUICK_START.md)
   - Review [PRD.md](./PRD.md) for requirements
   - Check [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for tasks

2. **Set Up Environment**

   - Install dependencies
   - Configure database
   - Set up environment variables

3. **Pick a Task**

   - Choose from [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
   - Create a feature branch
   - Implement the feature

4. **Test & Submit**
   - Write tests
   - Ensure code quality
   - Submit pull request

---

## **🎨 UI/UX Features**

- ✅ Modern Material-UI design
- ✅ Responsive layout (mobile, tablet, desktop)
- ✅ Dark/Light mode toggle
- ✅ Smooth animations
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Data tables with sorting/filtering
- ✅ Search functionality
- ✅ Print-friendly views

---

## **🔒 Security Features**

- ✅ JWT/NextAuth authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Input validation & sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Rate limiting
- ✅ Audit logging
- ✅ Secure session management

---

## **📊 Reports Overview**

1. **Customer List** - Complete customer database with export
2. **Supplier List** - All suppliers and items supplied
3. **Outstanding Receivables** - Customers with unpaid balances
4. **Outstanding Payables** - Suppliers with outstanding payments
5. **Sales by Product** - Product-wise sales summary
6. **Total Sales** - Period-wise sales reporting with charts

All reports support:

- 📤 PDF Export
- 📤 Excel Export
- 🖨️ Print-friendly views
- 📅 Date range filtering
- 🔍 Search functionality

---

## **🤝 Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## **📝 License**

This project is licensed under the Commercial License - see the [LICENSE](LICENSE) file for details.

---

## **👨‍💻 Development Team**

- **Project Type:** Full-stack Web Application
- **Estimated Timeline:** 8-12 weeks
- **Development Approach:** Agile/Iterative

---

## **📞 Support**

For questions or support:

- 📧 Email: support@yourdomain.com
- 📖 Documentation: See docs folder
- 🐛 Issues: GitHub Issues

---

## **🎯 Project Goals**

- ✅ Simplify inventory flow
- ✅ Monitor outstanding balances
- ✅ Provide accurate reporting
- ✅ Support daily business operations
- ✅ Scalable for future expansion

---

## **🌟 Acknowledgments**

- Built with [Next.js](https://nextjs.org/)
- UI powered by [Material-UI](https://mui.com/)
- Database ORM by [Prisma](https://www.prisma.io/)

---

**Ready to start building?** 👉 [QUICK_START.md](./QUICK_START.md)

**Need the big picture?** 👉 [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)

**Have questions?** Check the documentation in the root folder!

---

_Last Updated: December 1, 2025_
