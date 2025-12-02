# **DEVELOPMENT WORKFLOW**

## Inventory, Sales & Supplier Management System

---

## **Project Overview**

This workflow document provides a complete, step-by-step development plan for building the Inventory, Sales & Supplier Management System using the existing Next.js 15 + Material-UI starter theme.

**Tech Stack:**

- Next.js 15 (App Router)
- React 18
- TypeScript
- Material-UI (MUI)
- Tailwind CSS
- (Database layer to be determined)

---

## **PHASE 1: PROJECT SETUP & CONFIGURATION**

### **Task 1.1: Environment Setup** ✅

- [x] Set up environment variables (.env)
- [x] Configure database connection (MySQL)
- [x] Install additional required dependencies (react-hook-form, zod, date-fns, prisma, etc.)
- [x] Set up API route structure in `/app/api`

### **Task 1.2: Database Schema Design** ✅

- [x] Design database schema for all entities:
  - Customers table
  - Suppliers table
  - Products table
  - Raw Materials table
  - Sales Transactions table
  - Supplier Purchases table
  - Payments table (for tracking partial payments)
  - Users table (for authentication)
- [x] Create database migration files
- [x] Set up database seeding scripts for initial data (manual seed available)

### **Task 1.3: TypeScript Types & Interfaces** ✅

- [x] Create TypeScript interfaces for all entities in `/src/types`:
  - `customerTypes.ts`
  - `supplierTypes.ts`
  - `productTypes.ts`
  - `rawMaterialTypes.ts`
  - `salesTypes.ts`
  - `purchaseTypes.ts`
  - `userTypes.ts`
  - `reportTypes.ts`
  - `commonTypes.ts`
  - `index.ts`
- [x] Create form validation schemas using Zod (39 schemas created)

---

## **PHASE 2: AUTHENTICATION & USER MANAGEMENT**

### **Task 2.1: Authentication System** ✅

- [x] Implement proper authentication logic (JWT-based authentication)
- [x] Set up session management (custom JWT with HTTP-only cookies)
- [x] Create authentication middleware for API routes
- [x] Implement protected routes (Next.js middleware)
- [x] Add logout functionality
- [x] Add token refresh endpoint

### **Task 2.2: User Roles & Permissions** ✅

- [x] Create role-based access control (RBAC) system
- [x] Define permissions for each role:
  - Admin (full access - MANAGE all resources)
  - Sales Officer (sales & customers - full CRUD, read products/reports)
  - Procurement Officer (suppliers & raw materials - full CRUD, read reports)
  - Management (read-only reports - READ/EXPORT all resources)
- [x] Create HOC/middleware for role-based component rendering
- [x] Implement permission checking utilities (server + client hooks)

### **Task 2.3: User Management UI** ✅

- [x] Create user list page (with MUI DataGrid)
- [x] Create add/edit user form (with react-hook-form + Zod validation)
- [x] Implement user activation/deactivation (toggle in edit form)
- [x] Add CRUD API endpoints (admin-only with permissions)

---

## **PHASE 3: MAIN MENU MODULE - MASTER DATA**

### **Task 3.1: Customer Management** ✅

- [x] **Database Layer:**
  - Create Customer CRUD API routes (`/app/api/customers/route.ts`)
  - Implement auto-generation of customer codes
  - Add data validation
- [x] **UI Components:**
  - Create customer list page (`/app/(dashboard)/customers/page.tsx`)
  - Create customer add/edit form with validation
  - Implement search and filter functionality
  - Add pagination for customer list
  - Create customer detail view
- [x] **Business Logic:**
  - Validate business name uniqueness
  - Ensure customer code is immutable
  - Add form validation for all fields

### **Task 3.2: Supplier Management** ✅

- [x] **Database Layer:**
  - Create Supplier CRUD API routes (`/app/api/suppliers/route.ts`)
  - Create Items/Ingredients association with suppliers
  - Implement auto-generation of supplier codes and item codes
- [x] **UI Components:**
  - Create supplier list page (`/app/(dashboard)/suppliers/page.tsx`)
  - Create supplier add/edit form
  - Implement multi-item management for each supplier
  - Add search and filter functionality
  - Create supplier detail view with items list
- [x] **Business Logic:**
  - Handle one-to-many relationship (supplier → items)
  - Validate supplier and item code uniqueness
  - Prevent deletion of suppliers with associated purchases

### **Task 3.3: Product Management** ✅

- [x] **Database Layer:**
  - Create Product CRUD API routes (`/app/api/products/route.ts`)
  - Implement auto-generation of product codes
  - Add optional price list management
- [x] **UI Components:**
  - Create product list page (`/app/(dashboard)/products/page.tsx`)
  - Create product add/edit form
  - Implement search functionality
  - Add bulk import option (CSV/Excel)
- [x] **Business Logic:**
  - Ensure product code uniqueness
  - Validate product name
  - Handle product pricing (if applicable)

### **Task 3.4: Raw Materials Management** ✅

- [x] **Database Layer:**
  - Create Raw Material CRUD API routes (`/app/api/raw-materials/route.ts`)
  - Implement auto-generation of raw material codes
  - Link with suppliers
- [x] **UI Components:**
  - Create raw materials list page (`/app/(dashboard)/raw-materials/page.tsx`)
  - Create raw material add/edit form
  - Implement search functionality
  - Show supplier associations
- [x] **Business Logic:**
  - Ensure code uniqueness
  - Validate material name
  - Handle supplier relationships

---

## **PHASE 4: SALES TRANSACTION MODULE**

### **Task 4.1: Sales Recording System**

- [x] **Database Layer:**
  - Create Sales Transaction API routes (`/app/api/sales/route.ts`)
  - Implement transaction creation with all fields
  - Create payment tracking system
  - Add balance calculation logic
- [x] **UI Components:**
  - Create sales entry page (`/app/(dashboard)/sales/new/page.tsx`)
  - Implement product dropdown with search
  - Add auto-calculation for totals
  - Create payment method selector
  - Add date picker for supply and payment dates
  - Implement credit sale handling
- [x] **Business Logic:**
  - Auto-calculate total (Qty × Price)
  - Auto-calculate balance (Total - Amount Paid)
  - Validate payment amounts
  - Handle credit sales
  - Support multiple payment methods

### **Task 4.2: Sales Management & Updates**

- [x] **Database Layer:**
  - Create API routes for updating sales records
  - Implement payment update functionality
  - Add audit trail for edits
- [x] **UI Components:**
  - Create sales list page (`/app/(dashboard)/sales/page.tsx`)
  - Create sales detail/edit page
  - Add payment update form for credit sales
  - Implement sales search and filter
  - Show payment history for each sale
- [x] **Business Logic:**
  - Track partial payments
  - Update balance after each payment
  - Maintain audit log for all changes
  - Prevent overpayment

### **Task 4.3: Customer Outstanding Balances**

- [ ] **Database Layer:**
  - Create API to fetch outstanding balances by customer
  - Aggregate all unpaid/partially paid sales
- [ ] **UI Components:**
  - Create customer outstanding page (`/app/(dashboard)/sales/outstanding/page.tsx`)
  - Display customer-wise balance summary
  - Add drill-down to individual transactions
- [ ] **Business Logic:**
  - Calculate total outstanding per customer
  - Show aging of receivables (optional)
  - Filter by date range

---

## **PHASE 5: SUPPLIER PAYMENT MODULE**

### **Task 5.1: Raw Material Purchase Recording**

- [ ] **Database Layer:**
  - Create Purchase API routes (`/app/api/purchases/route.ts`)
  - Implement purchase transaction creation
  - Add payment tracking for suppliers
- [ ] **UI Components:**
  - Create purchase entry page (`/app/(dashboard)/purchases/new/page.tsx`)
  - Implement raw material dropdown with search
  - Add auto-calculation for totals
  - Add date picker for purchase date
  - Handle partial payments
- [ ] **Business Logic:**
  - Auto-calculate balance payable (Total - Amount Paid)
  - Validate payment amounts
  - Support multiple payments over time

### **Task 5.2: Purchase Management & Updates**

- [ ] **Database Layer:**
  - Create API routes for updating purchases
  - Implement payment update functionality
  - Add audit trail
- [ ] **UI Components:**
  - Create purchase list page (`/app/(dashboard)/purchases/page.tsx`)
  - Create purchase detail/edit page
  - Add payment update form
  - Show payment history
- [ ] **Business Logic:**
  - Track partial payments
  - Update balance after payments
  - Maintain audit log

### **Task 5.3: Supplier Outstanding Payables**

- [ ] **Database Layer:**
  - Create API to fetch outstanding payables by supplier
  - Aggregate all unpaid/partially paid purchases
- [ ] **UI Components:**
  - Create supplier payables page (`/app/(dashboard)/purchases/payables/page.tsx`)
  - Display supplier-wise payable summary
  - Add drill-down to individual purchases
- [ ] **Business Logic:**
  - Calculate total payable per supplier
  - Show aging of payables (optional)
  - Filter by date range

---

## **PHASE 6: REPORTS MODULE**

### **Task 6.1: Customer Reports**

- [ ] **Database Layer:**
  - Create API for customer list report (`/app/api/reports/customers/route.ts`)
  - Add export functionality (PDF/Excel data)
- [ ] **UI Components:**
  - Create customer list report page (`/app/(dashboard)/reports/customers/page.tsx`)
  - Add export buttons (PDF/Excel)
  - Implement search and filter
  - Add print-friendly view

### **Task 6.2: Supplier Reports**

- [ ] **Database Layer:**
  - Create API for supplier list report
  - Include items supplied
- [ ] **UI Components:**
  - Create supplier list report page (`/app/(dashboard)/reports/suppliers/page.tsx`)
  - Show suppliers with their items
  - Add export functionality

### **Task 6.3: Outstanding Payments Report**

- [ ] **Database Layer:**
  - Create API for outstanding customer payments
  - Calculate totals and aging
- [ ] **UI Components:**
  - Create outstanding payments report page (`/app/(dashboard)/reports/outstanding-receivables/page.tsx`)
  - Show customer-wise outstanding
  - Add total summary
  - Implement date filters

### **Task 6.4: Outstanding Payables Report**

- [ ] **Database Layer:**
  - Create API for outstanding supplier payables
- [ ] **UI Components:**
  - Create payables report page (`/app/(dashboard)/reports/outstanding-payables/page.tsx`)
  - Show supplier-wise payables
  - Add total summary

### **Task 6.5: Sales by Product Report**

- [ ] **Database Layer:**
  - Create API for product-wise sales summary
  - Aggregate quantity sold and revenue
- [ ] **UI Components:**
  - Create sales by product report page (`/app/(dashboard)/reports/sales-by-product/page.tsx`)
  - Show product performance
  - Add date range filters
  - Implement sorting and charts (optional)

### **Task 6.6: Total Sales Report**

- [ ] **Database Layer:**
  - Create API for total sales report
  - Support daily/weekly/monthly/yearly aggregation
- [ ] **UI Components:**
  - Create total sales report page (`/app/(dashboard)/reports/total-sales/page.tsx`)
  - Add date range selector
  - Show charts/graphs for visualization
  - Display payment method breakdown

---

## **PHASE 7: NAVIGATION & MENU STRUCTURE**

### **Task 7.1: Update Navigation Menu**

- [ ] Update `/src/data/navigation/verticalMenuData.tsx` with all modules:
  - Dashboard
  - Main Menu section:
    - Customers
    - Suppliers
    - Products
    - Raw Materials
  - Transactions section:
    - Sales
    - Purchases
  - Reports section:
    - Customer List
    - Supplier List
    - Outstanding Receivables
    - Outstanding Payables
    - Sales by Product
    - Total Sales
  - Settings section:
    - Users (Admin only)
    - Profile

### **Task 7.2: Implement Role-Based Menu**

- [ ] Create logic to filter menu items based on user role
- [ ] Hide/show menu items based on permissions
- [ ] Update `GenerateMenu.tsx` component if needed

---

## **PHASE 8: DASHBOARD & HOME PAGE**

### **Task 8.1: Dashboard Analytics**

- [ ] **Database Layer:**
  - Create API for dashboard statistics
  - Calculate key metrics (total sales, outstanding, etc.)
- [ ] **UI Components:**
  - Create dashboard page (`/app/(dashboard)/home/page.tsx`)
  - Add summary cards:
    - Total Sales (current period)
    - Total Outstanding from Customers
    - Total Payables to Suppliers
    - Recent Transactions
  - Add charts:
    - Sales trend
    - Top products
    - Payment status overview
  - Display quick actions

---

## **PHASE 9: SHARED COMPONENTS & UTILITIES**

### **Task 9.1: Reusable Form Components**

- [ ] Create reusable form components in `/src/components/forms`:
  - DatePicker wrapper
  - SearchableSelect/Autocomplete
  - CurrencyInput
  - FormSection wrapper
  - FormButtons (Save, Cancel, etc.)

### **Task 9.2: Data Table Component**

- [ ] Create reusable DataTable component with:
  - Sorting
  - Filtering
  - Pagination
  - Export functionality
  - Action buttons

### **Task 9.3: Utility Functions**

- [ ] Create utility functions in `/src/utils`:
  - Number formatting
  - Date formatting
  - Currency formatting
  - Export helpers (PDF/Excel)
  - Validation helpers

### **Task 9.4: API Client & Error Handling**

- [ ] Create API client wrapper
- [ ] Implement global error handling
- [ ] Add loading states
- [ ] Create toast/notification system

---

## **PHASE 10: AUDIT & HISTORY**

### **Task 10.1: Audit Trail Implementation**

- [ ] Create audit log table in database
- [ ] Implement logging for all CRUD operations
- [ ] Track user actions with timestamps
- [ ] Create audit log viewer (Admin only)

### **Task 10.2: Payment History**

- [ ] Create payment history tracking for sales
- [ ] Create payment history tracking for purchases
- [ ] Display payment timeline in detail views

---

## **PHASE 11: EXPORT & PRINTING**

### **Task 11.1: PDF Export**

- [ ] Install PDF generation library (e.g., jsPDF, react-pdf)
- [ ] Create PDF templates for reports
- [ ] Implement PDF download functionality

### **Task 11.2: Excel Export**

- [ ] Install Excel library (e.g., xlsx, exceljs)
- [ ] Implement Excel export for all reports
- [ ] Format Excel output properly

### **Task 11.3: Print Views**

- [ ] Create print-friendly CSS
- [ ] Add print button to reports
- [ ] Optimize print layouts

---

## **PHASE 12: SEARCH & FILTER FEATURES**

### **Task 12.1: Global Search**

- [ ] Implement global search in navbar
- [ ] Search across customers, suppliers, products
- [ ] Show search results with navigation

### **Task 12.2: Advanced Filters**

- [ ] Create filter components for each list page
- [ ] Add date range filters
- [ ] Implement multi-criteria filtering
- [ ] Add saved filter presets

---

## **PHASE 13: VALIDATION & ERROR HANDLING**

### **Task 13.1: Form Validation**

- [ ] Implement client-side validation using react-hook-form + Zod
- [ ] Add server-side validation in API routes
- [ ] Display user-friendly error messages
- [ ] Prevent duplicate entries

### **Task 13.2: Error Boundaries**

- [ ] Create error boundary components
- [ ] Implement error fallback UI
- [ ] Add error logging

### **Task 13.3: API Error Handling**

- [ ] Handle network errors
- [ ] Implement retry logic
- [ ] Show appropriate error messages
- [ ] Log errors for debugging

---

## **PHASE 14: PERFORMANCE OPTIMIZATION**

### **Task 14.1: Database Optimization**

- [ ] Add proper indexes to database tables
- [ ] Optimize queries for large datasets
- [ ] Implement pagination for all lists
- [ ] Add database query caching

### **Task 14.2: Frontend Optimization**

- [ ] Implement lazy loading for routes
- [ ] Optimize bundle size
- [ ] Add loading skeletons
- [ ] Implement virtual scrolling for large lists

### **Task 14.3: API Optimization**

- [ ] Implement API response caching
- [ ] Use React Query or SWR for data fetching
- [ ] Optimize API payloads
- [ ] Implement debouncing for search inputs

---

## **PHASE 15: SECURITY IMPLEMENTATION**

### **Task 15.1: Input Sanitization**

- [ ] Sanitize all user inputs
- [ ] Prevent SQL injection
- [ ] Prevent XSS attacks
- [ ] Implement CSRF protection

### **Task 15.2: API Security**

- [ ] Implement rate limiting
- [ ] Add API authentication middleware
- [ ] Validate all API inputs
- [ ] Implement proper CORS configuration

### **Task 15.3: Data Protection**

- [ ] Encrypt sensitive data
- [ ] Implement secure password hashing
- [ ] Add data backup mechanism
- [ ] Implement audit trails

---

## **PHASE 16: RESPONSIVE DESIGN**

### **Task 16.1: Mobile Optimization**

- [ ] Test all pages on mobile devices
- [ ] Optimize forms for mobile input
- [ ] Ensure tables are responsive
- [ ] Test navigation on mobile

### **Task 16.2: Tablet Optimization**

- [ ] Test on tablet breakpoints
- [ ] Optimize layout for medium screens
- [ ] Ensure touch interactions work

### **Task 16.3: Cross-Browser Testing**

- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Fix browser-specific issues
- [ ] Test on different screen sizes

---

## **PHASE 17: TESTING**

### **Task 17.1: Unit Testing**

- [ ] Set up testing framework (Jest + React Testing Library)
- [ ] Write unit tests for utility functions
- [ ] Test form validation logic
- [ ] Test calculation functions

### **Task 17.2: Integration Testing**

- [ ] Test API endpoints
- [ ] Test database operations
- [ ] Test authentication flow
- [ ] Test business logic

### **Task 17.3: E2E Testing**

- [ ] Set up E2E testing (Playwright or Cypress)
- [ ] Test critical user flows
- [ ] Test sales transaction flow
- [ ] Test purchase flow
- [ ] Test report generation

### **Task 17.4: Manual Testing**

- [ ] Create test scenarios document
- [ ] Test all CRUD operations
- [ ] Test edge cases
- [ ] Test role-based access
- [ ] Test with sample data

---

## **PHASE 18: DOCUMENTATION**

### **Task 18.1: Technical Documentation**

- [ ] Document API endpoints
- [ ] Document database schema
- [ ] Document component architecture
- [ ] Add code comments

### **Task 18.2: User Documentation**

- [ ] Create user manual
- [ ] Document workflows
- [ ] Create training materials
- [ ] Add help tooltips in UI

### **Task 18.3: Deployment Documentation**

- [ ] Document deployment process
- [ ] Document environment setup
- [ ] Create backup/restore procedures
- [ ] Document troubleshooting steps

---

## **PHASE 19: DEPLOYMENT PREPARATION**

### **Task 19.1: Production Configuration**

- [ ] Set up production environment variables
- [ ] Configure production database
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure logging

### **Task 19.2: Build Optimization**

- [ ] Optimize production build
- [ ] Minimize bundle size
- [ ] Optimize images
- [ ] Set up CDN (if needed)

### **Task 19.3: Deployment**

- [ ] Choose hosting platform (Vercel, AWS, etc.)
- [ ] Set up CI/CD pipeline
- [ ] Deploy to staging environment
- [ ] Deploy to production
- [ ] Set up monitoring and alerts

---

## **PHASE 20: POST-LAUNCH**

### **Task 20.1: Monitoring & Maintenance**

- [ ] Monitor application performance
- [ ] Track error rates
- [ ] Monitor database performance
- [ ] Set up automated backups

### **Task 20.2: User Feedback**

- [ ] Collect user feedback
- [ ] Create feedback mechanism in app
- [ ] Prioritize feature requests
- [ ] Fix reported bugs

### **Task 20.3: Iterative Improvements**

- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Add requested features
- [ ] Improve UX based on feedback

---

## **APPENDIX: ESTIMATED TIMELINE**

| Phase                      | Tasks     | Estimated Time |
| -------------------------- | --------- | -------------- |
| Phase 1: Setup             | 4 tasks   | 2-3 days       |
| Phase 2: Authentication    | 3 tasks   | 3-4 days       |
| Phase 3: Master Data       | 4 modules | 8-10 days      |
| Phase 4: Sales Module      | 3 tasks   | 5-6 days       |
| Phase 5: Supplier Payments | 3 tasks   | 4-5 days       |
| Phase 6: Reports           | 6 reports | 6-8 days       |
| Phase 7: Navigation        | 2 tasks   | 1 day          |
| Phase 8: Dashboard         | 1 task    | 2-3 days       |
| Phase 9: Shared Components | 4 tasks   | 3-4 days       |
| Phase 10: Audit            | 2 tasks   | 2-3 days       |
| Phase 11: Export/Print     | 3 tasks   | 3-4 days       |
| Phase 12: Search/Filter    | 2 tasks   | 2-3 days       |
| Phase 13: Validation       | 3 tasks   | 2-3 days       |
| Phase 14: Performance      | 3 tasks   | 3-4 days       |
| Phase 15: Security         | 3 tasks   | 3-4 days       |
| Phase 16: Responsive       | 3 tasks   | 2-3 days       |
| Phase 17: Testing          | 4 tasks   | 5-7 days       |
| Phase 18: Documentation    | 3 tasks   | 3-4 days       |
| Phase 19: Deployment       | 3 tasks   | 2-3 days       |
| Phase 20: Post-Launch      | 3 tasks   | Ongoing        |

**Total Estimated Development Time: 8-12 weeks**

---

## **DEVELOPMENT PRINCIPLES**

1. **Build Incrementally:** Complete each phase before moving to the next
2. **Test as You Go:** Write tests alongside feature development
3. **Code Reviews:** Have code reviewed before merging
4. **Commit Often:** Make small, focused commits
5. **Documentation:** Document as you develop
6. **User Feedback:** Get feedback early and often
7. **Performance First:** Consider performance in every decision
8. **Security First:** Never compromise on security

---

## **NEXT STEPS**

1. Review this workflow with the team
2. Adjust timeline based on team size and resources
3. Set up project management tool (Jira, Trello, etc.)
4. Create tickets for Phase 1 tasks
5. Begin development with Phase 1

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025  
**Status:** Ready for Development
