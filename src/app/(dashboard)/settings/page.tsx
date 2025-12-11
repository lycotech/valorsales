'use client'

import { useRouter } from 'next/navigation'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Skeleton
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import SecurityIcon from '@mui/icons-material/Security'
import PaletteIcon from '@mui/icons-material/Palette'
import NotificationsIcon from '@mui/icons-material/Notifications'
import HistoryIcon from '@mui/icons-material/History'
import GroupIcon from '@mui/icons-material/Group'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { useSession } from '@/lib/auth/session-client'
import { getInitials } from '@/utils/getInitials'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading } = useSession()

  const settingsItems = [
    {
      title: 'Profile',
      description: 'Update your name, email, and password',
      icon: <PersonIcon />,
      href: '/settings/profile',
      color: 'primary.main'
    },
    {
      title: 'Security',
      description: 'Manage your password and account security',
      icon: <SecurityIcon />,
      href: '/settings/profile',
      color: 'error.main'
    },
    {
      title: 'Appearance',
      description: 'Customize theme, colors, and layout',
      icon: <PaletteIcon />,
      href: '/settings/appearance',
      color: 'secondary.main',
      disabled: true
    },
    {
      title: 'Notifications',
      description: 'Configure email and system notifications',
      icon: <NotificationsIcon />,
      href: '/settings/notifications',
      color: 'warning.main',
      disabled: true
    }
  ]

  const adminItems = [
    {
      title: 'User Management',
      description: 'Add, edit, and manage system users',
      icon: <GroupIcon />,
      href: '/admin/users',
      color: 'info.main'
    },
    {
      title: 'Audit Logs',
      description: 'View system activity and changes',
      icon: <HistoryIcon />,
      href: '/audit-logs',
      color: 'success.main'
    }
  ]

  if (loading) {
    return (
      <Box>
        <Typography variant='h4' mb={4}>
          Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Skeleton variant='circular' width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton width={150} height={32} sx={{ mx: 'auto' }} />
                <Skeleton width={200} height={24} sx={{ mx: 'auto' }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton height={300} />
          </Grid>
        </Grid>
      </Box>
    )
  }

  if (!user) {
    router.push('/login')

    return null
  }

  const isAdmin = user.role === 'admin'

  return (
    <Box>
      <Typography variant='h4' mb={4}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* User Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: '2rem',
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: 2
                }}
              >
                {getInitials(user.name)}
              </Avatar>
              <Typography variant='h5' gutterBottom>
                {user.name}
              </Typography>
              <Typography color='text.secondary' gutterBottom>
                {user.email}
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  textTransform: 'capitalize',
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-block',
                  mt: 1
                }}
              >
                {user.role}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings Menu */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Account Settings
              </Typography>
              <List>
                {settingsItems.map((item, index) => (
                  <Box key={item.title}>
                    <ListItemButton
                      onClick={() => !item.disabled && router.push(item.href)}
                      disabled={item.disabled}
                      sx={{ borderRadius: 1, mb: 0.5 }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: item.color, width: 40, height: 40 }}>{item.icon}</Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        secondary={item.disabled ? `${item.description} (Coming soon)` : item.description}
                      />
                      <ChevronRightIcon color='action' />
                    </ListItemButton>
                    {index < settingsItems.length - 1 && <Divider sx={{ my: 0.5 }} />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Admin Section */}
          {isAdmin && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Administration
                </Typography>
                <List>
                  {adminItems.map((item, index) => (
                    <Box key={item.title}>
                      <ListItemButton onClick={() => router.push(item.href)} sx={{ borderRadius: 1, mb: 0.5 }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: item.color, width: 40, height: 40 }}>{item.icon}</Avatar>
                        </ListItemIcon>
                        <ListItemText primary={item.title} secondary={item.description} />
                        <ChevronRightIcon color='action' />
                      </ListItemButton>
                      {index < adminItems.length - 1 && <Divider sx={{ my: 0.5 }} />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
