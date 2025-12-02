# Task 2.2: User Roles & Permissions - COMPLETED ✅

**Completion Date**: [Current Session]  
**Status**: ✅ COMPLETE  
**Phase**: Phase 2 - Authentication & Authorization (2/3 tasks complete)

---

## 📋 Task Overview

Implemented a comprehensive Role-Based Access Control (RBAC) system with:
- **Permissions Configuration**: Central definition of roles, resources, and actions
- **Server-Side Middleware**: API route protection with permission checks
- **Client-Side Hooks**: React hooks for permission-based UI logic
- **UI Components**: HOC and gate components for conditional rendering

---

## 🎯 Deliverables

### 1. Core Permissions System
**File**: `src/lib/auth/permissions.ts` (210 lines)

**Enums**:
- `Resource`: 10 resource types (CUSTOMERS, SUPPLIERS, PRODUCTS, RAW_MATERIALS, SALES, PURCHASES, REPORTS, USERS, DASHBOARD)
- `Action`: 6 action types (CREATE, READ, UPDATE, DELETE, EXPORT, MANAGE)

**Role Permissions**:
```typescript
ROLE_PERMISSIONS = {
  admin: { ALL_RESOURCES: ['MANAGE'] },
  sales: {
    CUSTOMERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    PRODUCTS: ['READ'],
    SALES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    REPORTS: ['READ'],
    DASHBOARD: ['READ']
  },
  procurement: {
    SUPPLIERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    RAW_MATERIALS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    PURCHASES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    REPORTS: ['READ'],
    DASHBOARD: ['READ']
  },
  management: {
    ALL_RESOURCES: ['READ', 'EXPORT'],
    REPORTS: ['READ', 'EXPORT'],
    DASHBOARD: ['READ']
  }
}
```

**Utility Functions** (9 functions):
- `hasPermission(role, resource, action)` - Core permission checker
- `canCreate(role, resource)` - Check CREATE permission
- `canRead(role, resource)` - Check READ permission
- `canUpdate(role, resource)` - Check UPDATE permission
- `canDelete(role, resource)` - Check DELETE permission
- `canExport(role, resource)` - Check EXPORT permission
- `canManage(role, resource)` - Check MANAGE permission
- `getRolePermissions(role)` - Get all permissions for a role
- `getAllowedActions(role, resource)` - Get allowed actions for a resource

---

### 2. Server-Side Middleware
**File**: `src/lib/auth/permissionMiddleware.ts` (160 lines)

**Functions**:
- `requirePermission(resource, action, handler)` - Single permission check
- `requireAnyPermission(permissions[], handler)` - At least one permission required
- `requireAllPermissions(permissions[], handler)` - All permissions required

**Usage Example**:
```typescript
// Protect API route - only users with CREATE permission for CUSTOMERS
export const POST = requirePermission(
  Resource.CUSTOMERS,
  Action.CREATE,
  async (request, user) => {
    // Handler with authenticated user
    const body = await request.json()
    // ... create customer logic
  }
)
```

---

### 3. Client-Side Hooks
**File**: `src/hooks/usePermissions.ts` (140 lines)

**Hooks** (11 hooks):
- `usePermission(resource, action)` - Check single permission
- `useAnyPermission(permissions[])` - Check multiple (OR logic)
- `useAllPermissions(permissions[])` - Check multiple (AND logic)
- `useAllowedActions(resource)` - Get allowed actions for resource
- `useCanCreate(resource)` - Convenience hook for CREATE
- `useCanRead(resource)` - Convenience hook for READ
- `useCanUpdate(resource)` - Convenience hook for UPDATE
- `useCanDelete(resource)` - Convenience hook for DELETE
- `useCanExport(resource)` - Convenience hook for EXPORT
- `useCanManage(resource)` - Convenience hook for MANAGE

**Session Hook**:
**File**: `src/lib/auth/session-client.ts` (70 lines)
- `useSession()` - Client-side hook to access current user session

**Usage Example**:
```typescript
function CustomerActions({ customerId }) {
  const canEdit = useCanUpdate(Resource.CUSTOMERS)
  const canDelete = useCanDelete(Resource.CUSTOMERS)

  return (
    <>
      {canEdit && <EditButton id={customerId} />}
      {canDelete && <DeleteButton id={customerId} />}
    </>
  )
}
```

---

### 4. UI Components
**File**: `src/components/auth/PermissionGate.tsx` (165 lines)

**Components & HOC**:
- `withPermission(Component, resource, action)` - Higher-Order Component wrapper
- `<PermissionGate>` - Single permission gate
- `<AnyPermissionGate>` - Multiple permissions (OR logic)
- `<AllPermissionsGate>` - Multiple permissions (AND logic)

**Usage Examples**:
```tsx
// HOC Pattern
const ProtectedDeleteButton = withPermission(
  DeleteButton,
  Resource.CUSTOMERS,
  Action.DELETE
)

// Component Pattern
<PermissionGate resource={Resource.CUSTOMERS} action={Action.CREATE}>
  <CreateCustomerButton />
</PermissionGate>

// Multiple Permissions (OR)
<AnyPermissionGate
  permissions={[
    { resource: Resource.CUSTOMERS, action: Action.CREATE },
    { resource: Resource.CUSTOMERS, action: Action.UPDATE }
  ]}
>
  <CustomerForm />
</AnyPermissionGate>

// Multiple Permissions (AND)
<AllPermissionsGate
  permissions={[
    { resource: Resource.REPORTS, action: Action.READ },
    { resource: Resource.REPORTS, action: Action.EXPORT }
  ]}
>
  <ExportReportButton />
</AllPermissionsGate>
```

---

## 🔑 Role Capabilities

### Admin Role
- **Full System Access**: MANAGE permission for all resources
- Can perform all actions (CREATE, READ, UPDATE, DELETE, EXPORT) on all entities
- User management capabilities

### Sales Role
- **Customers**: Full CRUD access
- **Products**: Read-only access
- **Sales**: Full CRUD access
- **Reports**: Read-only access
- **Dashboard**: Read-only access

### Procurement Role
- **Suppliers**: Full CRUD access
- **Raw Materials**: Full CRUD access
- **Purchases**: Full CRUD access
- **Reports**: Read-only access
- **Dashboard**: Read-only access

### Management Role
- **All Resources**: Read-only access
- **Reports**: Can read and export
- **Dashboard**: Read-only access
- Cannot create, update, or delete any records

---

## 🧪 Testing Recommendations

### Unit Tests
1. **permissions.ts**:
   - Test `hasPermission()` for all role-resource-action combinations
   - Verify admin has MANAGE for all resources
   - Verify sales cannot access procurement resources
   - Verify management has only READ/EXPORT access

2. **permissionMiddleware.ts**:
   - Test `requirePermission()` returns 401 for unauthenticated
   - Test returns 403 for unauthorized users
   - Test allows access for authorized users
   - Test `requireAnyPermission()` with multiple conditions
   - Test `requireAllPermissions()` with multiple conditions

3. **usePermissions.ts**:
   - Mock `useSession()` with different user roles
   - Test all convenience hooks (useCanCreate, useCanRead, etc.)
   - Test `useAllowedActions()` returns correct actions

4. **PermissionGate.tsx**:
   - Test components render children when authorized
   - Test components render fallback when unauthorized
   - Test HOC wrapping functionality

### Integration Tests
1. **API Routes**:
   - Test protected routes reject unauthorized users
   - Test protected routes allow authorized users
   - Test role-specific access (sales can't access supplier endpoints)

2. **UI Components**:
   - Test buttons/forms hidden for unauthorized users
   - Test UI shows correct actions based on role
   - Test fallback rendering

---

## 📊 Implementation Statistics

| Category | Count | Details |
|----------|-------|---------|
| **Files Created** | 5 | permissions.ts, permissionMiddleware.ts, usePermissions.ts, session-client.ts, PermissionGate.tsx |
| **Total Lines** | ~745 | Fully documented and typed |
| **Enums** | 2 | Resource (10 values), Action (6 values) |
| **Utility Functions** | 9 | Core permission checkers |
| **Middleware Functions** | 3 | API route protection |
| **React Hooks** | 11 | Client-side permission checking |
| **React Components** | 4 | HOC + 3 gate components |
| **Supported Roles** | 4 | admin, sales, procurement, management |
| **Protected Resources** | 10 | All major system entities |
| **Actions** | 6 | CRUD + EXPORT + MANAGE |

---

## 🔗 Dependencies

**Existing Files Used**:
- `src/types/index.ts` - UserRole enum
- `src/types/userTypes.ts` - UserWithoutPassword interface
- `src/lib/auth/session.ts` - getCurrentUser() server function
- `src/app/api/auth/session/route.ts` - Session API endpoint

**No External Packages Added** - Uses only existing dependencies

---

## 📝 Usage Patterns

### Pattern 1: Protect API Route
```typescript
// src/app/api/customers/route.ts
import { requirePermission } from '@/lib/auth/permissionMiddleware'
import { Resource, Action } from '@/lib/auth/permissions'

export const GET = requirePermission(
  Resource.CUSTOMERS,
  Action.READ,
  async (request, user) => {
    // Only users with READ permission reach here
    const customers = await db.customer.findMany()
    return NextResponse.json({ success: true, data: customers })
  }
)
```

### Pattern 2: Conditional UI Rendering
```tsx
// src/app/(dashboard)/customers/page.tsx
import { PermissionGate } from '@/components/auth/PermissionGate'
import { Resource, Action } from '@/lib/auth/permissions'

export default function CustomersPage() {
  return (
    <>
      <h1>Customers</h1>
      <PermissionGate resource={Resource.CUSTOMERS} action={Action.CREATE}>
        <CreateButton />
      </PermissionGate>
      <CustomerList />
    </>
  )
}
```

### Pattern 3: Hook-Based Logic
```tsx
// src/components/CustomerRow.tsx
import { useCanUpdate, useCanDelete } from '@/hooks/usePermissions'
import { Resource } from '@/lib/auth/permissions'

export function CustomerRow({ customer }) {
  const canEdit = useCanUpdate(Resource.CUSTOMERS)
  const canDelete = useCanDelete(Resource.CUSTOMERS)

  return (
    <tr>
      <td>{customer.name}</td>
      <td>
        {canEdit && <EditButton id={customer.id} />}
        {canDelete && <DeleteButton id={customer.id} />}
      </td>
    </tr>
  )
}
```

### Pattern 4: Higher-Order Component
```tsx
// src/components/ProtectedButtons.tsx
import { withPermission } from '@/components/auth/PermissionGate'
import { Resource, Action } from '@/lib/auth/permissions'

const DeleteButton = ({ onClick }) => (
  <button onClick={onClick}>Delete</button>
)

// Only renders for users with DELETE permission
export const ProtectedDeleteButton = withPermission(
  DeleteButton,
  Resource.CUSTOMERS,
  Action.DELETE
)
```

---

## 🎓 Key Learnings

1. **TypeScript Enum Imports**: When using enums as runtime values (not just types), import them normally without `type` keyword
2. **Client/Server Separation**: Created separate session utilities for server (`session.ts`) and client (`session-client.ts`)
3. **Flexible Middleware**: Three middleware variants (single, any, all) cover all permission checking scenarios
4. **Developer Experience**: Convenience hooks (useCanCreate, useCanRead, etc.) improve code readability
5. **Component Patterns**: Both HOC and component gate patterns give developers flexibility

---

## ✅ Completion Checklist

- [x] Define Resource and Action enums
- [x] Create ROLE_PERMISSIONS configuration for all 4 roles
- [x] Implement core `hasPermission()` function
- [x] Create 8 convenience permission utility functions
- [x] Build 3 server-side middleware functions
- [x] Create 11 client-side React hooks
- [x] Build useSession hook for client-side authentication
- [x] Create withPermission HOC
- [x] Create PermissionGate components (3 variants)
- [x] Fix all TypeScript compilation errors
- [x] Fix all ESLint errors
- [x] Write comprehensive documentation

---

## 🚀 Next Steps (Task 2.3)

**Task 2.3: User Management UI**
1. Create user list page with DataGrid
2. Implement create/edit user forms
3. Add user activation/deactivation functionality
4. Apply permission gates (only admins can manage users)
5. Integrate with authentication and permissions systems

**Files to Create**:
- `src/app/(dashboard)/admin/users/page.tsx` - User list page
- `src/app/(dashboard)/admin/users/create/page.tsx` - Create user form
- `src/app/(dashboard)/admin/users/[id]/edit/page.tsx` - Edit user form
- `src/app/api/users/route.ts` - User CRUD API endpoints
- `src/app/api/users/[id]/route.ts` - Individual user API endpoints
- `src/views/admin/users/UserList.tsx` - User list component
- `src/views/admin/users/UserForm.tsx` - User form component

---

## 📚 Related Documentation

- [PRD.md](../PRD.md) - Original requirements
- [TASK_2.1_COMPLETED.md](./TASK_2.1_COMPLETED.md) - Authentication system
- [DEVELOPMENT_WORKFLOW.md](../DEVELOPMENT_WORKFLOW.md) - Full roadmap
- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - File organization

---

**Task 2.2 Status**: ✅ **COMPLETE**  
**Phase 2 Progress**: 2/3 tasks complete (67%)  
**Overall Progress**: ~17% complete (5.5/32 tasks)
