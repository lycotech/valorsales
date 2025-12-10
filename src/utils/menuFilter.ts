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

  // First pass: filter items based on permissions
  const filteredItems = menuData
    .map(item => {
      // Handle sections with children (nested structure)
      const section = item as VerticalSectionDataType

      if (section.isSection && section.children) {
        console.log('📂 Processing section with children:', section.label)

        const filteredChildren = filterMenuByPermissions(section.children, userRole)

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

      // Handle section headers (without children - just dividers with labels)
      if (section.isSection && !section.children) {
        console.log('📂 Processing section header (divider):', section.label)

        // Keep section headers - we'll remove empty ones in second pass
        return item
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

  // Second pass: remove section headers that have no items after them
  const result: VerticalMenuDataType[] = []

  for (let i = 0; i < filteredItems.length; i++) {
    const item = filteredItems[i]
    const section = item as VerticalSectionDataType

    if (section.isSection && !section.children) {
      // Check if there are any non-section items after this section header
      // until the next section header or end of array
      let hasItemsAfter = false

      for (let j = i + 1; j < filteredItems.length; j++) {
        const nextItem = filteredItems[j] as VerticalSectionDataType

        if (nextItem.isSection && !nextItem.children) {
          // Hit another section header, stop looking
          break
        }

        // Found a non-section item
        hasItemsAfter = true
        break
      }

      if (hasItemsAfter) {
        result.push(item)
      } else {
        console.log('🚫 Removing empty section header:', section.label)
      }
    } else {
      result.push(item)
    }
  }

  console.log('✅ filterMenuByPermissions result:', { inputCount: menuData.length, outputCount: result.length })

  return result
}
