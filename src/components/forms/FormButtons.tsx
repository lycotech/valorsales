'use client'

/**
 * FormButtons - Standardized form button group
 */

import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

interface FormButtonsProps {
  onSubmit?: () => void
  onCancel?: () => void
  onReset?: () => void
  submitLabel?: string
  cancelLabel?: string
  resetLabel?: string
  loading?: boolean
  disabled?: boolean
  showCancel?: boolean
  showReset?: boolean
  align?: 'left' | 'center' | 'right' | 'between'
  sticky?: boolean
  submitColor?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  submitVariant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  type?: 'submit' | 'button'
}

export default function FormButtons({
  onSubmit,
  onCancel,
  onReset,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  resetLabel = 'Reset',
  loading = false,
  disabled = false,
  showCancel = true,
  showReset = false,
  align = 'right',
  sticky = false,
  submitColor = 'primary',
  submitVariant = 'contained',
  size = 'medium',
  fullWidth = false,
  type = 'submit'
}: FormButtonsProps) {
  const alignMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
    between: 'space-between'
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: alignMap[align],
        gap: 2,
        mt: 3,
        pt: sticky ? 2 : 0,
        pb: sticky ? 2 : 0,
        ...(sticky && {
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          mx: -3,
          px: 3
        })
      }}
    >
      {align === 'between' && <Box sx={{ flex: 1 }} />}

      {showReset && (
        <Button
          variant='text'
          color='inherit'
          size={size}
          onClick={onReset}
          disabled={loading || disabled}
          fullWidth={fullWidth}
        >
          {resetLabel}
        </Button>
      )}

      {showCancel && (
        <Button
          variant='outlined'
          color='inherit'
          size={size}
          onClick={onCancel}
          disabled={loading}
          fullWidth={fullWidth}
        >
          {cancelLabel}
        </Button>
      )}

      <Button
        type={type}
        variant={submitVariant}
        color={submitColor}
        size={size}
        onClick={onSubmit}
        disabled={loading || disabled}
        fullWidth={fullWidth}
        startIcon={loading && <CircularProgress size={16} color='inherit' />}
      >
        {loading ? 'Saving...' : submitLabel}
      </Button>
    </Box>
  )
}

// ============================================
// DELETE CONFIRMATION BUTTONS
// ============================================

interface DeleteButtonsProps {
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmLabel?: string
  cancelLabel?: string
  size?: 'small' | 'medium' | 'large'
}

export function DeleteButtons({
  onConfirm,
  onCancel,
  loading = false,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  size = 'medium'
}: DeleteButtonsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
      <Button variant='outlined' color='inherit' size={size} onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        variant='contained'
        color='error'
        size={size}
        onClick={onConfirm}
        disabled={loading}
        startIcon={loading && <CircularProgress size={16} color='inherit' />}
      >
        {loading ? 'Deleting...' : confirmLabel}
      </Button>
    </Box>
  )
}

// ============================================
// ICON BUTTON GROUP
// ============================================

interface IconButtonGroupProps {
  buttons: Array<{
    icon: string
    onClick: () => void
    tooltip?: string
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default'
    disabled?: boolean
  }>
  size?: 'small' | 'medium' | 'large'
}

import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

export function IconButtonGroup({ buttons, size = 'small' }: IconButtonGroupProps) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {buttons.map((button, index) => (
        <Tooltip key={index} title={button.tooltip || ''}>
          <span>
            <IconButton
              size={size}
              onClick={button.onClick}
              disabled={button.disabled}
              color={button.color === 'default' ? undefined : button.color}
            >
              <i className={button.icon} />
            </IconButton>
          </span>
        </Tooltip>
      ))}
    </Box>
  )
}
