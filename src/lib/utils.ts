// Utility functions for formatting and shared helpers

export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCurrencyWithDecimals(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatPhoneNumber(phone: string): string {
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

export function formatMileage(value: number): string {
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

export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function classNames(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
