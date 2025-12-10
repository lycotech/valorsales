'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'
import type { UserRole } from '@/types/commonTypes'

// Component Imports
import { Menu } from '@menu/vertical-menu'
import { GenerateVerticalMenu } from '@components/GenerateMenu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSession } from '@/lib/auth/session-client'

// Data Imports
import verticalMenuData from '@/data/navigation/verticalMenuData'

// Util Imports
import { filterMenuByPermissions } from '@/utils/menuFilter'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { user, loading } = useSession()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  // Filter menu data based on user permissions
  const filteredMenuData = useMemo(() => {
    const menuData = verticalMenuData()

    console.log('📋 Menu generation:', {
      loading,
      hasUser: !!user,
      userRole: user?.role,
      menuItemsCount: menuData.length
    })

    // While loading, show empty menu to prevent flash
    if (loading) {
      console.log('⏳ Loading session, showing empty menu')

      return []
    }

    // If no user after loading, return empty menu
    if (!user) {
      console.log('❌ No user, showing empty menu')

      return []
    }

    // Filter based on user role (cast string to UserRole enum)
    const userRole = user.role as UserRole

    console.log('🔄 About to filter menu:', { userRole, userRoleType: typeof userRole })

    const filtered = filterMenuByPermissions(menuData, userRole)

    console.log('✅ Menu filtered:', {
      role: user.role,
      userRoleCasted: userRole,
      originalCount: menuData.length,
      filteredCount: filtered.length
    })

    return filtered
  }, [user, loading])

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <GenerateVerticalMenu menuData={filteredMenuData} />
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
