# API Routes Structure

This directory contains all API endpoints for the Inventory Management System.

## Endpoints Overview

### Health Check
- `GET /api/health` - API health check

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer by ID
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create new supplier
- `GET /api/suppliers/[id]` - Get supplier by ID
- `PUT /api/suppliers/[id]` - Update supplier
- `DELETE /api/suppliers/[id]` - Delete supplier

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get product by ID
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Raw Materials
- `GET /api/raw-materials` - List all raw materials
- `POST /api/raw-materials` - Create new raw material
- `GET /api/raw-materials/[id]` - Get raw material by ID
- `PUT /api/raw-materials/[id]` - Update raw material
- `DELETE /api/raw-materials/[id]` - Delete raw material

## Status

✅ Basic route structure created
⏳ Implementation pending (marked with TODO comments)

## Next Steps

1. Complete Task 1.2: Database Schema Design
2. Complete Task 1.3: TypeScript Types & Interfaces
3. Implement authentication (Task 2.1)
4. Implement CRUD operations for each endpoint

## Notes

- All routes return 501 (Not Implemented) status until logic is implemented
- Each route has TODO comments indicating what needs to be built
- Error handling structure is in place
- Follow Next.js 15 App Router patterns with async params

