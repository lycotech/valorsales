/**
 * Utility Functions for Number, Date, and Currency Formatting
 */

// ============================================
// NUMBER FORMATTING
// ============================================

/**
 * Format a number with locale-specific separators
 */
export function formatNumber(value: number | string | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) return '0'

  return num.toLocaleString('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) return '0%'

  return `${value.toFixed(decimals)}%`
}

/**
 * Parse a formatted number string back to number
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9.-]/g, '')

  return parseFloat(cleaned) || 0
}

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Format a number as Nigerian Naira
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: { showSymbol?: boolean; decimals?: number } = {}
): string {
  const { showSymbol = true, decimals = 2 } = options

  if (value === null || value === undefined || value === '') return showSymbol ? '₦0.00' : '0.00'

  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) return showSymbol ? '₦0.00' : '0.00'

  const formatted = num.toLocaleString('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  return showSymbol ? `₦${formatted}` : formatted
}

/**
 * Format currency for display in compact form (e.g., ₦1.2M)
 */
export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '₦0'

  if (value >= 1000000000) {
    return `₦${(value / 1000000000).toFixed(1)}B`
  }

  if (value >= 1000000) {
    return `₦${(value / 1000000).toFixed(1)}M`
  }

  if (value >= 1000) {
    return `₦${(value / 1000).toFixed(1)}K`
  }

  return `₦${value.toFixed(0)}`
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: '2-digit' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  }

  return d.toLocaleDateString('en-NG', formatOptions[format])
}

/**
 * Format a date with time
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  options: { includeSeconds?: boolean } = {}
): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(options.includeSeconds && { second: '2-digit' })
  }

  return d.toLocaleString('en-NG', dateOptions)
}

/**
 * Format a date for API requests (ISO format)
 */
export function formatDateForAPI(date: Date | string | null | undefined): string | null {
  if (!date) return null

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return null

  return d.toISOString()
}

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`

  return formatDate(d, 'medium')
}

/**
 * Get date range for reporting periods
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  let start: Date

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      const dayOfWeek = now.getDay()

      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)

      start = new Date(now.getFullYear(), quarter * 3, 1)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      break
  }

  return { start, end }
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Truncate a string with ellipsis
 */
export function truncate(str: string | null | undefined, maxLength: number = 50): string {
  if (!str) return ''
  if (str.length <= maxLength) return str

  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return ''

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert to title case
 */
export function titleCase(str: string | null | undefined): string {
  if (!str) return ''

  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Generate a slug from a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0

  return false
}

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')

  // Nigerian numbers: 0801..., +234801..., 234801...
  return /^(0|234|\+234)?[789][01]\d{8}$/.test(cleaned)
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ============================================
// MISC HELPERS
// ============================================

/**
 * Generate a random ID
 */
export function generateId(prefix: string = '', length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = prefix

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Group an array of objects by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key])

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }

      groups[groupKey].push(item)

      return groups
    },
    {} as Record<string, T[]>
  )
}

/**
 * Sort an array of objects by a key
 */
export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1

    return 0
  })
}
