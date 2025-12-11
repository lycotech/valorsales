'use client'

/**
 * CurrencyInput - A formatted currency input component
 */

import { useState, useEffect, forwardRef } from 'react'

import TextField, { type TextFieldProps } from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

interface CurrencyInputProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value: number | string | null
  onChange: (value: number) => void
  currencySymbol?: string
  decimalPlaces?: number
  maxValue?: number
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currencySymbol = '₦', decimalPlaces = 2, maxValue, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')

    // Format number for display
    const formatForDisplay = (num: number): string => {
      if (isNaN(num)) return ''

      return num.toLocaleString('en-NG', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      })
    }

    // Parse display value back to number
    const parseToNumber = (str: string): number => {
      const cleaned = str.replace(/[^0-9.-]/g, '')

      return parseFloat(cleaned) || 0
    }

    // Initialize display value from prop
    useEffect(() => {
      const numValue = typeof value === 'string' ? parseFloat(value) : value || 0

      setDisplayValue(formatForDisplay(numValue))
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Allow empty input
      if (inputValue === '') {
        setDisplayValue('')
        onChange(0)

        return
      }

      // Remove non-numeric characters except decimal point
      const cleaned = inputValue.replace(/[^0-9.]/g, '')

      // Ensure only one decimal point
      const parts = cleaned.split('.')

      let finalValue = parts[0]

      if (parts.length > 1) {
        finalValue += '.' + parts[1].slice(0, decimalPlaces)
      }

      const numValue = parseFloat(finalValue) || 0

      // Check max value
      if (maxValue !== undefined && numValue > maxValue) {
        return
      }

      setDisplayValue(finalValue)
      onChange(numValue)
    }

    const handleBlur = () => {
      const numValue = parseToNumber(displayValue)

      setDisplayValue(formatForDisplay(numValue))
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Remove formatting on focus
      const numValue = parseToNumber(displayValue)

      if (numValue > 0) {
        setDisplayValue(numValue.toString())
      }

      // Select all text
      setTimeout(() => e.target.select(), 0)
    }

    return (
      <TextField
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position='start'>{currencySymbol}</InputAdornment>,
            inputProps: {
              inputMode: 'decimal',
              pattern: '[0-9]*'
            }
          }
        }}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export default CurrencyInput
