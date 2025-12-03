/**
 * Menu Filtering Utilities
 * Filter menu items based on user permissions
 */

import type { VerticalMenuDataType, VerticalSectionDataType, VerticalSubMenuDataType } from '@/types/menuTypes'
import { hasPermission, type Resource, type Action } from '@/lib/auth/permissions'
import type { UserRole } from '@/types'

/**
 * Filter menu items based on user role and permissions
 * @param menuData - Array of menu items
 * @param userRole - Current user's role
 * @returns Filtered menu array
 */
export function filterMenuByPermissions(
  menuData: VerticalMenuDataType[],
  userRole: UserRole | null
): VerticalMenuDataType[] {
  console.log('🔍 filterMenuByPermissions called:', { userRole, menuDataLength: menuData.length })

  if (!userRole) {
    console.log('❌ No userRole, returning empty array')

    return []
  }

  const filtered = menuData
    .map(item => {
      // Handle sections
      const section = item as VerticalSectionDataType

      if (section.isSection) {
        console.log('📂 Processing section:', section.label)

        const filteredChildren = section.children
          ? filterMenuByPermissions(section.children, userRole)
          : []

        console.log('📂 Section children:', { label: section.label, childCount: filteredChildren.length })

        // Only include section if it has visible children
        if (filteredChildren.length === 0) {
          console.log('🚫 Removing empty section:', section.label)

          return null
        }

        return {
          ...section,
          children: filteredChildren
        }
      }

      // Handle sub-menus
      const subMenu = item as VerticalSubMenuDataType

      if (subMenu.children) {
        console.log('📁 Processing submenu:', subMenu.label)

        // Check sub-menu permission if defined
        if (subMenu.permission) {
          const hasAccess = hasPermission(
            userRole,
            subMenu.permission.resource as Resource,
            subMenu.permission.action as Action
          )

          console.log('🔐 Submenu permission check:', { label: subMenu.label, hasAccess, permission: subMenu.permission, userRole })

          if (!hasAccess) {
            return null
          }
        }

        const filteredChildren = filterMenuByPermissions(subMenu.children, userRole)

        console.log('📁 Submenu children:', { label: subMenu.label, childCount: filteredChildren.length })

        // Only include sub-menu if it has visible children
        if (filteredChildren.length === 0) {
          console.log('🚫 Removing empty submenu:', subMenu.label)

          return null
        }

        return {
          ...subMenu,
          children: filteredChildren
        }
      }

      // Handle regular menu items
      const menuItem = item as any

      console.log('🔵 Processing regular item:', { label: menuItem.label, hasPermission: !!menuItem.permission })

      if (menuItem.permission) {
        const hasAccess = hasPermission(
          userRole,
          menuItem.permission.resource as Resource,
          menuItem.permission.action as Action
        )

        console.log('🔐 Menu item permission check:', {
          label: menuItem.label,
          hasAccess,
          permission: menuItem.permission,
          userRole,
          resource: menuItem.permission.resource,
          action: menuItem.permission.action
        })

        if (!hasAccess) {
          console.log('🚫 No access to menu item:', menuItem.label)

          return null
        }
      }

      console.log('✅ Including menu item:', menuItem.label || item.label)

      return item
    })
    .filter((item): item is VerticalMenuDataType => item !== null)

  console.log('✅ filterMenuByPermissions result:', { inputCount: menuData.length, outputCount: filtered.length })

  return filtered
}
