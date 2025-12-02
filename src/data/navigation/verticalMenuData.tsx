// Type Imports
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
    icon: 'ri-user-3-line'
  },
  {
    label: 'Suppliers',
    href: '/suppliers',
    icon: 'ri-truck-line'
  },
  {
    label: 'Products',
    href: '/products',
    icon: 'ri-shopping-bag-3-line'
  },
  {
    label: 'Raw Materials',
    href: '/raw-materials',
    icon: 'ri-box-3-line'
  },
  {
    label: 'Transactions',
    isSection: true
  },
  {
    label: 'Sales',
    icon: 'ri-shopping-cart-line',
    children: [
      {
        label: 'All Sales',
        href: '/sales'
      },
      {
        label: 'Outstanding Balances',
        href: '/sales/outstanding'
      }
    ]
  },
  {
    label: 'Purchases',
    icon: 'ri-shopping-basket-line',
    children: [
      {
        label: 'All Purchases',
        href: '/purchases'
      },
      {
        label: 'Supplier Payables',
        href: '/purchases/payables'
      }
    ]
  },
  {
    label: 'Settings',
    isSection: true
  },
  {
    label: 'Users',
    href: '/users',
    icon: 'ri-user-settings-line'
  }
]

export default verticalMenuData
