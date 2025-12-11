'use client'

import { useState, useEffect, useRef } from 'react'

import { useRouter } from 'next/navigation'

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Avatar,
  Skeleton
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import PersonIcon from '@mui/icons-material/Person'
import LockIcon from '@mui/icons-material/Lock'

import { useSession } from '@/lib/auth/session-client'
import { getInitials } from '@/utils/getInitials'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const isMounted = useRef(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (user && isMounted.current) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate name
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters')

      return
    }

    // Validate password change if attempting
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setError('Current password is required to change password')

        return
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match')

        return
      }

      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters')

        return
      }
    }

    try {
      setSaving(true)

      const updateData: {
        name: string
        email?: string
        currentPassword?: string
        newPassword?: string
      } = { name: name.trim() }

      if (email !== user?.email) {
        updateData.email = email
      }

      if (newPassword) {
        updateData.currentPassword = currentPassword
        updateData.newPassword = newPassword
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!isMounted.current) return

      if (result.success) {
        setSuccess('Profile updated successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')

        // Refresh the page to update session data
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setError(result.error || 'Failed to update profile')
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to update profile')
      }
    } finally {
      if (isMounted.current) {
        setSaving(false)
      }
    }
  }

  if (sessionLoading) {
    return (
      <Box>
        <Typography variant='h4' mb={4}>
          My Profile
        </Typography>
        <Card>
          <CardContent>
            <Box display='flex' alignItems='center' gap={3} mb={4}>
              <Skeleton variant='circular' width={80} height={80} />
              <Box>
                <Skeleton width={200} height={32} />
                <Skeleton width={150} height={24} />
              </Box>
            </Box>
            <Skeleton height={56} />
            <Skeleton height={56} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (!user) {
    router.push('/login')

    return null
  }

  return (
    <Box>
      <Typography variant='h4' mb={4}>
        My Profile
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity='success' sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleUpdateProfile}>
        <Grid container spacing={3}>
          {/* Profile Information Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: '2.5rem',
                    bgcolor: 'primary.main',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  {getInitials(name || user.name)}
                </Avatar>
                <Typography variant='h5' gutterBottom>
                  {name || user.name}
                </Typography>
                <Typography color='text.secondary' gutterBottom>
                  {email || user.email}
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
                <Typography variant='caption' display='block' color='text.secondary' mt={2}>
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Edit Profile Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display='flex' alignItems='center' gap={1} mb={3}>
                  <PersonIcon color='primary' />
                  <Typography variant='h6'>Account Information</Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Full Name'
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      helperText='Your display name throughout the application'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Email Address'
                      type='email'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      helperText='Used for login and notifications'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label='Role' value={user.role} disabled sx={{ textTransform: 'capitalize' }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Account Status'
                      value={user.isActive ? 'Active' : 'Inactive'}
                      disabled
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Box display='flex' alignItems='center' gap={1} mb={3}>
                  <LockIcon color='primary' />
                  <Typography variant='h6'>Change Password</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary' mb={3}>
                  Leave blank if you don&apos;t want to change your password
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label='Current Password'
                      type='password'
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label='New Password'
                      type='password'
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      helperText='Minimum 6 characters'
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label='Confirm New Password'
                      type='password'
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Box mt={4} display='flex' justifyContent='flex-end'>
                  <Button type='submit' variant='contained' size='large' startIcon={<SaveIcon />} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}
