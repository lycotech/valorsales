'use client'

/**
 * FormSection - A styled section container for forms
 */

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'

import { useState } from 'react'

interface FormSectionProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  action?: React.ReactNode
  icon?: React.ReactNode
  noPadding?: boolean
  elevation?: number
  variant?: 'outlined' | 'elevation'
}

export default function FormSection({
  title,
  subtitle,
  children,
  collapsible = false,
  defaultExpanded = true,
  action,
  icon,
  noPadding = false,
  elevation = 0,
  variant = 'outlined'
}: FormSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <Card elevation={elevation} variant={variant} sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography variant='h6'>{title}</Typography>
          </Box>
        }
        subheader={subtitle}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {action}
            {collapsible && (
              <IconButton onClick={() => setExpanded(!expanded)} size='small'>
                <i className={`ri-arrow-${expanded ? 'up' : 'down'}-s-line`} />
              </IconButton>
            )}
          </Box>
        }
        sx={{
          '& .MuiCardHeader-title': { fontSize: '1.125rem' },
          cursor: collapsible ? 'pointer' : 'default'
        }}
        onClick={collapsible ? () => setExpanded(!expanded) : undefined}
      />
      <Divider />
      <Collapse in={collapsible ? expanded : true}>
        <CardContent sx={noPadding ? { p: 0, '&:last-child': { pb: 0 } } : {}}>{children}</CardContent>
      </Collapse>
    </Card>
  )
}

// ============================================
// FORM GRID - Responsive grid for form fields
// ============================================

interface FormGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  spacing?: number
}

export function FormGrid({ children, columns = 2, spacing = 3 }: FormGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: columns > 1 ? 'repeat(2, 1fr)' : '1fr',
          md: `repeat(${Math.min(columns, 3)}, 1fr)`,
          lg: `repeat(${columns}, 1fr)`
        },
        gap: spacing
      }}
    >
      {children}
    </Box>
  )
}

// ============================================
// FORM ROW - Horizontal row for form elements
// ============================================

interface FormRowProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  spacing?: number
  wrap?: boolean
}

export function FormRow({ children, align = 'center', justify = 'start', spacing = 2, wrap = true }: FormRowProps) {
  const justifyMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around'
  }

  const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch'
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        gap: spacing
      }}
    >
      {children}
    </Box>
  )
}

// ============================================
// FORM FIELD WRAPPER - Wrapper with label
// ============================================

interface FormFieldWrapperProps {
  label?: string
  required?: boolean
  helperText?: string
  error?: boolean
  children: React.ReactNode
  fullWidth?: boolean
}

export function FormFieldWrapper({
  label,
  required,
  helperText,
  error,
  children,
  fullWidth = true
}: FormFieldWrapperProps) {
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <Typography
          variant='body2'
          component='label'
          sx={{
            mb: 0.5,
            display: 'block',
            fontWeight: 500,
            color: error ? 'error.main' : 'text.primary'
          }}
        >
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Typography>
      )}
      {children}
      {helperText && (
        <Typography
          variant='caption'
          sx={{
            mt: 0.5,
            display: 'block',
            color: error ? 'error.main' : 'text.secondary'
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  )
}
