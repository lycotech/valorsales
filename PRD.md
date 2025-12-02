Below is a clean, structured **Product Requirements Document (PRD)** based fully on your outline.
It is written in a professional format suitable for development planning, approval, and implementation.

---

# **PRODUCT REQUIREMENTS DOCUMENT (PRD)**

## **Inventory, Sales & Supplier Management System**

---

## **1. Product Overview**

A lightweight web-based system for managing customers, products, suppliers, raw materials, sales transactions, and supplier payments. The system will also generate reports for operational monitoring.

The goal is to simplify inventory flow, monitor outstanding balances, and provide accurate reporting for daily business activities.

---

## **2. System Modules**

1. **Main Menu**
2. **Sales**
3. **Reports**

---

# **3. Functional Requirements**

---

# **3.1 Main Menu**

The Main Menu provides access to the system's data entry and master records.

### **3.1.1 Customer Details**

| Field                | Description                      |
| -------------------- | -------------------------------- |
| Name of Business     | Full registered business name    |
| Address of Business  | Physical address                 |
| Phone contacts       | Phone number(s)                  |
| Location of Business | City/State                       |
| Customer code        | Auto-generated unique identifier |

**Additional Requirements**

- Ability to **edit/update** all customer information.
- Customer code is system-generated and immutable.

---

### **3.1.2 Supplier Details**

| Field                      | Description                       |
| -------------------------- | --------------------------------- |
| Name of Supplier           | Supplier name                     |
| Address of Supplier        | Full address                      |
| Phone contacts             | Supplier phone                    |
| Location of Business       | City/State                        |
| Supplier Code              | Auto-generated unique identifier  |
| Ingredients/Items supplied | List of items supplied            |
| Item Code                  | Auto-generated code for each item |

**Additional Requirements**

- Ability to **edit/update** all supplier information.
- Supplier and Item codes are system-generated and immutable.
- One supplier may have multiple items/ingredients.

---

### **3.1.3 Product Details**

| Field        | Description                      |
| ------------ | -------------------------------- |
| Product Code | Auto-generated unique identifier |
| Product Name | Name of product                  |

**Additional Requirements**

- Ability to **edit/update** product name.
- Product code is system-generated.

---

### **3.1.4 Raw Materials / Ingredients Details**

| Field             | Description                      |
| ----------------- | -------------------------------- |
| Raw Material Code | Auto-generated unique identifier |
| Raw Material Name | Ingredient name                  |

**Additional Requirements**

- Ability to **edit/update** raw material name.
- Raw material code is system-generated.

---

# **3.2 Transactions Module**

---

## **3.2.1 Sale of Products**

When recording a sale, the system should capture the following:

| Field               | Rules/Description                                    |
| ------------------- | ---------------------------------------------------- |
| Product Code        | Dropdown search; auto-displays Product Name          |
| Product Name        | Auto-filled when code is selected                    |
| Quantity            | User input                                           |
| Price/Amount        | User input or from product price list (if available) |
| Total (Qty × Price) | Auto-calculated                                      |
| Date of Supply      | User-selected date                                   |
| Mode of Payment     | Cash, Transfer, POS, Credit, Others                  |
| Amount Paid         | User input                                           |
| Balance             | Auto-calculated = Total - Amount Paid                |
| Date of Payment     | Optional if payment is not complete                  |

**Business Logic**

- System should support **credit sales** (balance tracking).
- Payment updates should be logged until balance = 0.
- Ability to edit incorrect entries (audit trail recommended).

---

## **3.2.2 Payment for Suppliers**

Used to record purchase of raw materials and payment settlement.

| Field                 | Rules/Description                                  |
| --------------------- | -------------------------------------------------- |
| Raw Material Code     | Dropdown selection                                 |
| Item Name             | Auto-filled                                        |
| Quantity Purchased    | User input                                         |
| Date of Purchase      | Date selector                                      |
| Amount Paid           | User input                                         |
| Total Purchase Amount | User input or calculated (if unit price available) |
| Balance Payable       | Auto-calculated = Total Amount - Amount Paid       |

**Business Logic**

- Support for **partial payments**.
- Multiple payments can be recorded until balance = 0.
- Editable entries with audit history.

---

# **3.3 Reports Module**

---

## **3.3.1 List of Customers**

- Display complete customer database.
- Export to PDF/Excel.

## **3.3.2 List of Suppliers**

- Display all suppliers and their items supplied.
- Export to PDF/Excel.

## **3.3.3 Outstanding Payments from Customers**

- Show customers with unpaid balances.
- Include total outstanding per customer.

## **3.3.4 Outstanding Payables**

- Show suppliers with balance remaining.
- Display total payable amounts.

## **3.3.5 Total Sales by Product**

- Summarize sales per product.
- Include quantity sold and total revenue.

## **3.3.6 Total Sales (General)**

- Show total sales for selected period (daily/weekly/monthly/yearly).

---

# **4. Non-Functional Requirements**

### **4.1 Usability**

- Clean and simple dashboard.
- Mobile-responsive.
- Search and filter functionalities.

### **4.2 Performance**

- System should support at least 10,000 records with fast search.

### **4.3 Security**

- User authentication and role management.
- Audit logs for edits/updates.
- Protect against SQL injection, CSRF, XSS.

### **4.4 Scalability**

- Should allow expansion into full inventory and accounting in the future.

---

# **5. User Roles**

### **Admin**

- Full CRUD access.
- Can generate and export all reports.

### **Sales Officer**

- Can record sales.
- Can view customers.
- Restricted from system settings.

### **Procurement Officer**

- Can manage suppliers and raw materials.

### **Management**

- Read-only access to reports.

---

# **6. System Flow Summary**

1. Create customer, supplier, product, and raw material records.
2. Record sales transactions.
3. Record raw material purchases and supplier payments.
4. System calculates balances automatically.
5. Generate reports for management and accounting.

---
