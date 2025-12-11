'use client'

/**
 * SearchableSelect - Autocomplete select with search functionality
 */

import { useState, useMemo } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export interface SelectOption {
  value: string | number
  label: string
  description?: string
  disabled?: boolean
  group?: string
  [key: string]: any
}

interface SearchableSelectProps {
  options: SelectOption[]
  value: SelectOption | SelectOption[] | null
  onChange: (value: SelectOption | SelectOption[] | null) => void
  label: string
  placeholder?: string
  multiple?: boolean
  loading?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
  groupBy?: boolean
  renderOption?: (option: SelectOption) => React.ReactNode
  noOptionsText?: string
  loadingText?: string
  clearable?: boolean
  freeSolo?: boolean
  onInputChange?: (value: string) => void
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder,
  multiple = false,
  loading = false,
  disabled = false,
  error = false,
  helperText,
  required = false,
  fullWidth = true,
  size = 'medium',
  groupBy = false,
  renderOption,
  noOptionsText = 'No options',
  loadingText = 'Loading...',
  clearable = true,
  freeSolo = false,
  onInputChange
}: SearchableSelectProps) {
  const [inputValue, setInputValue] = useState('')

  // Group options if needed
  const groupedOptions = useMemo(() => {
    if (!groupBy) return options

    const groups: Record<string, SelectOption[]> = {}

    options.forEach(option => {
      const group = option.group || 'Other'

      if (!groups[group]) groups[group] = []
      groups[group].push(option)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([_, items]) => items)
  }, [options, groupBy])

  return (
    <Autocomplete
      options={groupedOptions}
      value={value}
      onChange={(_, newValue) => onChange(newValue as SelectOption | SelectOption[] | null)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue)
        onInputChange?.(newInputValue)
      }}
      multiple={multiple}
      disabled={disabled}
      loading={loading}
      fullWidth={fullWidth}
      size={size}
      disableClearable={!clearable}
      freeSolo={freeSolo}
      getOptionLabel={option => (typeof option === 'string' ? option : option.label)}
      getOptionDisabled={option => (typeof option !== 'string' && option.disabled ? true : false)}
      groupBy={groupBy ? option => (typeof option !== 'string' ? option.group || 'Other' : 'Other') : undefined}
      isOptionEqualToValue={(option, value) => {
        if (typeof option === 'string' || typeof value === 'string') return option === value

        return option.value === value.value
      }}
      noOptionsText={noOptionsText}
      loadingText={loadingText}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props

        return (
          <Box component='li' key={key} {...otherProps}>
            {renderOption ? (
              renderOption(option)
            ) : (
              <Box>
                <Typography variant='body1'>{option.label}</Typography>
                {option.description && (
                  <Typography variant='caption' color='text.secondary'>
                    {option.description}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index })

          return <Chip key={key} label={option.label} {...tagProps} size='small' />
        })
      }
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color='inherit' size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }
          }}
        />
      )}
    />
  )
}

// ============================================
// ASYNC SEARCHABLE SELECT
// ============================================

interface AsyncSearchableSelectProps extends Omit<SearchableSelectProps, 'options' | 'loading'> {
  loadOptions: (inputValue: string) => Promise<SelectOption[]>
  debounceMs?: number
  minChars?: number
}

export function AsyncSearchableSelect({
  loadOptions,
  debounceMs = 300,
  minChars = 1,
  ...props
}: AsyncSearchableSelectProps) {
  const [options, setOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const handleInputChange = (inputValue: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (inputValue.length < minChars) {
      setOptions([])

      return
    }

    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const results = await loadOptions(inputValue)

        setOptions(results)
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    setDebounceTimer(timer)
  }

  return <SearchableSelect {...props} options={options} loading={loading} onInputChange={handleInputChange} />
}
