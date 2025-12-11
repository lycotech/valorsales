'use client'

/**
 * DatePickerWrapper - Wrapper around MUI DatePicker with common configurations
 */

import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import TextField from '@mui/material/TextField'
import { enGB } from 'date-fns/locale'

interface DatePickerWrapperProps {
  value: Date | null
  onChange: (date: Date | null) => void
  label: string
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  error?: boolean
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
  disablePast?: boolean
  disableFuture?: boolean
  format?: string
}

export default function DatePickerWrapper({
  value,
  onChange,
  label,
  placeholder,
  minDate,
  maxDate,
  disabled = false,
  error = false,
  helperText,
  required = false,
  fullWidth = true,
  size = 'medium',
  disablePast = false,
  disableFuture = false,
  format = 'dd/MM/yyyy'
}: DatePickerWrapperProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <DatePicker
        value={value}
        onChange={onChange}
        label={label}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        disablePast={disablePast}
        disableFuture={disableFuture}
        format={format}
        slotProps={{
          textField: {
            placeholder,
            error,
            helperText,
            required,
            fullWidth,
            size
          }
        }}
      />
    </LocalizationProvider>
  )
}

// ============================================
// DATE TIME PICKER WRAPPER
// ============================================

interface DateTimePickerWrapperProps extends Omit<DatePickerWrapperProps, 'format'> {
  format?: string
  minutesStep?: number
}

export function DateTimePickerWrapper({
  value,
  onChange,
  label,
  placeholder,
  minDate,
  maxDate,
  disabled = false,
  error = false,
  helperText,
  required = false,
  fullWidth = true,
  size = 'medium',
  disablePast = false,
  disableFuture = false,
  format = 'dd/MM/yyyy HH:mm',
  minutesStep = 15
}: DateTimePickerWrapperProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <DateTimePicker
        value={value}
        onChange={onChange}
        label={label}
        disabled={disabled}
        minDateTime={minDate}
        maxDateTime={maxDate}
        disablePast={disablePast}
        disableFuture={disableFuture}
        format={format}
        minutesStep={minutesStep}
        slotProps={{
          textField: {
            placeholder,
            error,
            helperText,
            required,
            fullWidth,
            size
          }
        }}
      />
    </LocalizationProvider>
  )
}

// ============================================
// DATE RANGE PICKER
// ============================================

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onStartDateChange: (date: Date | null) => void
  onEndDateChange: (date: Date | null) => void
  startLabel?: string
  endLabel?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  required?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
  disablePast?: boolean
  disableFuture?: boolean
  format?: string
  startError?: boolean
  endError?: boolean
  startHelperText?: string
  endHelperText?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  minDate,
  maxDate,
  disabled = false,
  required = false,
  fullWidth = true,
  size = 'medium',
  disablePast = false,
  disableFuture = false,
  format = 'dd/MM/yyyy',
  startError = false,
  endError = false,
  startHelperText,
  endHelperText
}: DateRangePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <DatePicker
          value={startDate}
          onChange={onStartDateChange}
          label={startLabel}
          disabled={disabled}
          minDate={minDate}
          maxDate={endDate || maxDate}
          disablePast={disablePast}
          disableFuture={disableFuture}
          format={format}
          slotProps={{
            textField: {
              error: startError,
              helperText: startHelperText,
              required,
              fullWidth,
              size,
              sx: fullWidth ? { flex: 1, minWidth: 200 } : {}
            }
          }}
        />
        <DatePicker
          value={endDate}
          onChange={onEndDateChange}
          label={endLabel}
          disabled={disabled}
          minDate={startDate || minDate}
          maxDate={maxDate}
          disablePast={disablePast}
          disableFuture={disableFuture}
          format={format}
          slotProps={{
            textField: {
              error: endError,
              helperText: endHelperText,
              required,
              fullWidth,
              size,
              sx: fullWidth ? { flex: 1, minWidth: 200 } : {}
            }
          }}
        />
      </div>
    </LocalizationProvider>
  )
}
