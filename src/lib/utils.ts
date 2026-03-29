// Utility functions for formatting and shared helpers

function formatWithCurrency(
  value: number | null | undefined,
  currency: string,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-'
  }

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value)
  } catch {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value)
  }
}

function parseValidDate(value: string | Date | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatCurrency(value: number | null | undefined, currency = 'EUR'): string {
  return formatWithCurrency(value, currency, 0, 0)
}

export function formatCurrencyWithDecimals(
  value: number | null | undefined,
  currency = 'EUR'
): string {
  return formatWithCurrency(value, currency, 2, 2)
}

export function formatDate(date: string | Date | null | undefined): string {
  const parsedDate = parseValidDate(date)

  if (!parsedDate) {
    return '-'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const parsedDate = parseValidDate(date)

  if (!parsedDate) {
    return '-'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate)
}

export function formatTime(date: string | Date | null | undefined): string {
  const parsedDate = parseValidDate(date)

  if (!parsedDate) {
    return '-'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate)
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) {
    return '-'
  }

  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  return phone
}

export function formatDistance(km: number): string {
  if (km < 1000) {
    return `${km} km`
  }
  return `${(km / 1000).toFixed(1)} k km`
}

export function formatMileage(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-'
  }

  return `${value.toLocaleString('fr-FR')} km`
}

export function parseDateInput(value: string, endOfDay = false): Date {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }

  return date
}

export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function toSearchValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.toLowerCase()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value).toLowerCase()
  }

  return value == null ? '' : String(value).toLowerCase()
}

export function toFiniteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function classNames(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
