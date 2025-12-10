// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'
import { Resource, Action } from '@/lib/auth/permissions'

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
    icon: 'ri-user-3-line',
    permission: {
      resource: Resource.CUSTOMERS,
      action: Action.READ
    }
  },
  {
    label: 'Suppliers',
    href: '/suppliers',
    icon: 'ri-truck-line',
    permission: {
      resource: Resource.SUPPLIERS,
      action: Action.READ
    }
  },
  {
    label: 'Products',
    href: '/products',
    icon: 'ri-shopping-bag-3-line',
    permission: {
      resource: Resource.PRODUCTS,
      action: Action.READ
    }
  },
  {
    label: 'Raw Materials',
    href: '/raw-materials',
    icon: 'ri-box-3-line',
    permission: {
      resource: Resource.RAW_MATERIALS,
      action: Action.READ
    }
  },
  {
    label: 'Transactions',
    isSection: true
  },
  {
    label: 'Sales',
    icon: 'ri-shopping-cart-line',
    permission: {
      resource: Resource.SALES,
      action: Action.READ
    },
    children: [
      {
        label: 'All Sales',
        href: '/sales',
        permission: {
          resource: Resource.SALES,
          action: Action.READ
        }
      },
      {
        label: 'Outstanding Balances',
        href: '/sales/outstanding',
        permission: {
          resource: Resource.SALES,
          action: Action.READ
        }
      },
      {
        label: 'Customer Credits',
        href: '/sales/customer-credits',
        permission: {
          resource: Resource.SALES,
          action: Action.READ
        }
      }
    ]
  },
  {
    label: 'Inventory',
    icon: 'ri-stack-line',
    permission: {
      resource: Resource.INVENTORY,
      action: Action.READ
    },
    children: [
      {
        label: 'Product Stock',
        href: '/inventory/products',
        permission: {
          resource: Resource.INVENTORY,
          action: Action.READ
        }
      },
      {
        label: 'Raw Materials Stock',
        href: '/inventory/raw-materials',
        permission: {
          resource: Resource.INVENTORY,
          action: Action.READ
        }
      },
      {
        label: 'Goods Received',
        href: '/inventory/goods-received',
        permission: {
          resource: Resource.INVENTORY,
          action: Action.UPDATE
        }
      },
      {
        label: 'Stock Adjustments',
        href: '/inventory/adjustments',
        permission: {
          resource: Resource.INVENTORY,
          action: Action.UPDATE
        }
      },
      {
        label: 'Low Stock Alerts',
        href: '/inventory/alerts',
        permission: {
          resource: Resource.INVENTORY,
          action: Action.READ
        }
      }
    ]
  },
  {
    label: 'Purchases',
    icon: 'ri-shopping-basket-line',
    permission: {
      resource: Resource.PURCHASES,
      action: Action.READ
    },
    children: [
      {
        label: 'All Purchases',
        href: '/purchases',
        permission: {
          resource: Resource.PURCHASES,
          action: Action.READ
        }
      },
      {
        label: 'Supplier Payables',
        href: '/purchases/payables',
        permission: {
          resource: Resource.PURCHASES,
          action: Action.READ
        }
      }
    ]
  },
  {
    label: 'Reports',
    isSection: true
  },
  {
    label: 'Customer Reports',
    href: '/reports/customers',
    icon: 'ri-file-list-3-line',
    permission: {
      resource: Resource.REPORTS,
      action: Action.READ
    }
  },
  {
    label: 'Supplier Reports',
    href: '/reports/suppliers',
    icon: 'ri-file-list-2-line',
    permission: {
      resource: Resource.REPORTS,
      action: Action.READ
    }
  },
  {
    label: 'Outstanding Receivables',
    href: '/reports/outstanding-receivables',
    icon: 'ri-money-dollar-circle-line',
    permission: {
      resource: Resource.REPORTS,
      action: Action.READ
    }
  },
  {
    label: 'Outstanding Payables',
    href: '/purchases/payables',
    icon: 'ri-refund-2-line',
    permission: {
      resource: Resource.REPORTS,
      action: Action.READ
    }
  },
  {
    label: 'Sales by Product',
    href: '/reports/sales-by-product',
    icon: 'ri-bar-chart-box-line',
    permission: {
      resource: Resource.REPORTS,
      action: Action.READ
    }
  },
  {
    label: 'Total Sales Report',
    href: '/reports/total-sales',
    icon: 'ri-line-chart-line',
    permission: {
      resource: Resource.REPORTS,
      action: Action.READ
    }
  },
  {
    label: 'Settings',
    isSection: true
  },
  {
    label: 'Users',
    href: '/users',
    icon: 'ri-user-settings-line',
    permission: {
      resource: Resource.USERS,
      action: Action.MANAGE
    }
  }
]

export default verticalMenuData
