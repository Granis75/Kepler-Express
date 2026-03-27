// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// ============================================================================
// MISSION CONSTRAINTS
// ============================================================================

export const MISSION_MIN_REVENUE = 50 // EUR
export const MISSION_MAX_REVENUE = 10000 // EUR
export const MISSION_PROFITABLE_MIN_MARGIN = 15 // percentage

// ============================================================================
// EXPENSE CONSTRAINTS
// ============================================================================

export const EXPENSE_MAX_AMOUNT = 5000 // EUR
export const EXPENSE_DAILY_LIMIT = 50000 // EUR

// ============================================================================
// DRIVER ADVANCE THRESHOLDS
// ============================================================================

export const DRIVER_ADVANCE_WARNING_THRESHOLD = 500 // EUR
export const DRIVER_ADVANCE_CRITICAL_THRESHOLD = 2000 // EUR

// ============================================================================
// INVOICE & PAYMENT THRESHOLDS
// ============================================================================

export const INVOICE_OVERDUE_THRESHOLD_DAYS = 30 // days
export const INVOICE_CRITICAL_OVERDUE_DAYS = 60 // days

// ============================================================================
// VEHICLE MAINTENANCE THRESHOLDS
// ============================================================================

export const SERVICE_WARNING_THRESHOLD_KM = 2000 // km before service is due
export const SERVICE_CRITICAL_THRESHOLD_KM = 500 // km - critical warning
export const STANDARD_SERVICE_INTERVAL_KM = 15000 // km between services
export const YEARLY_SERVICE_INTERVAL_MONTHS = 12 // months between services

// ============================================================================
// LICENSE & COMPLIANCE
// ============================================================================

export const LICENSE_EXPIRY_WARNING_DAYS = 90 // days before expiry to warn
export const LICENSE_EXPIRY_CRITICAL_DAYS = 30 // days before expiry for critical warning
export const REGISTRATION_EXPIRY_WARNING_DAYS = 90
export const REGISTRATION_EXPIRY_CRITICAL_DAYS = 30

// ============================================================================
// CACHE DURATION
// ============================================================================

export const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
export const CACHE_DURATION_LONG = 30 * 60 * 1000 // 30 minutes
export const CACHE_DURATION_SHORT = 1 * 60 * 1000 // 1 minute

// ============================================================================
// DATE RANGES
// ============================================================================

export const DATE_RANGE_7_DAYS = 7
export const DATE_RANGE_30_DAYS = 30
export const DATE_RANGE_90_DAYS = 90
export const DATE_RANGE_1_YEAR = 365

// ============================================================================
// BUSINESS RULES
// ============================================================================

export const MIN_PROFILE_NAME_LENGTH = 2
export const MAX_PROFILE_NAME_LENGTH = 100

export const MIN_CLIENT_NAME_LENGTH = 2
export const MAX_CLIENT_NAME_LENGTH = 150

export const MIN_VEHICLE_NAME_LENGTH = 2
export const MAX_VEHICLE_NAME_LENGTH = 100

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_CURRENCY = 'EUR'
export const DEFAULT_LANGUAGE = 'fr-FR'
export const DEFAULT_TIMEZONE = 'Europe/Paris'

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

export const ADMIN_ROLES = ['admin']
export const MANAGER_ROLES = ['admin', 'manager']
export const ACCOUNTANT_ROLES = ['admin', 'accountant']
export const DRIVER_ROLES = ['driver']

// ============================================================================
// API RESPONSE DEFAULTS
// ============================================================================

export const DEFAULT_TIMEOUT_MS = 30000 // 30 seconds
export const MAX_RETRIES = 3
export const RETRY_DELAY_MS = 1000 // 1 second
