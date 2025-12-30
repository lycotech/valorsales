import { exportReportToPDF } from './src/utils/exportHelpers'

const manualContent = {
  filename: 'ValorSales_Training_Manual',
  title: 'ValorSales Training Manual & Documentation',
  subtitle: 'Comprehensive User & Admin Guide',
  sections: [
    {
      title: 'Introduction',
      type: 'text' as const,
      content:
        'Welcome to ValorSales. This manual covers all modules, workflows, and best practices for users and admins.'
    },
    {
      title: 'Customer Management',
      type: 'text' as const,
      content:
        'Manage customers: add, edit, view, and delete customer records. Use the Customers menu to access the customer list and details.'
    },
    {
      title: 'Supplier Management',
      type: 'text' as const,
      content:
        'Manage suppliers and their items. Prevent deletion if purchases exist. Use the Suppliers menu for all supplier operations.'
    },
    {
      title: 'Product & Raw Materials',
      type: 'text' as const,
      content: 'Add, edit, and manage products and raw materials. Bulk import options are available for products.'
    },
    {
      title: 'Sales & Purchases',
      type: 'text' as const,
      content:
        'Record sales and purchases, track payments, and view outstanding balances. Use the Sales and Purchases menus.'
    },
    {
      title: 'Inventory Management',
      type: 'text' as const,
      content:
        'Track product and raw material stock, view low stock alerts, and perform manual adjustments. Access via the Inventory menu.'
    },
    {
      title: 'Reports & Export',
      type: 'text' as const,
      content:
        'Generate and export reports (PDF/Excel/Print) for sales, customers, suppliers, and inventory. Use the Reports menu.'
    },
    {
      title: 'Audit & Security',
      type: 'text' as const,
      content:
        'All changes are logged. Only authorized users can access sensitive features. Review audit logs in the Audit Logs menu.'
    },
    {
      title: 'Troubleshooting & FAQs',
      type: 'text' as const,
      content:
        'If you encounter issues, check your permissions, ensure data is valid, and consult the admin. For more help, see the documentation or contact support.'
    }
  ]
}

exportReportToPDF(manualContent)
