// Business rule validators

import { Mission, Driver, Vehicle, MissionStatus, DriverStatus, VehicleStatus } from '../types'
import { parseDateInput } from './utils'

// ============================================================================
// MISSION VALIDATORS
// ============================================================================

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export function validateMissionCreation(data: {
  client_id: string
  revenue_amount: number
  estimated_cost_amount: number
  departure_location: string
  arrival_location: string
  departure_datetime: string
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.client_id?.trim()) {
    errors.push({ field: 'client_id', message: 'Client is required' })
  }

  if (data.revenue_amount <= 0) {
    errors.push({ field: 'revenue_amount', message: 'Revenue must be greater than 0' })
  }

  if (data.revenue_amount > 10000) {
    errors.push({ field: 'revenue_amount', message: 'Revenue cannot exceed 10,000 EUR' })
  }

  if (data.estimated_cost_amount < 0) {
    errors.push({ field: 'estimated_cost_amount', message: 'Estimated cost cannot be negative' })
  }

  if (data.estimated_cost_amount > data.revenue_amount) {
    errors.push({ field: 'estimated_cost_amount', message: 'Estimated cost cannot exceed revenue' })
  }

  if (!data.departure_location?.trim()) {
    errors.push({ field: 'departure_location', message: 'Departure location is required' })
  }

  if (!data.arrival_location?.trim()) {
    errors.push({ field: 'arrival_location', message: 'Arrival location is required' })
  }

  if (data.departure_location === data.arrival_location) {
    errors.push({ field: 'arrival_location', message: 'Departure and arrival locations cannot be the same' })
  }

  if (!data.departure_datetime) {
    errors.push({ field: 'departure_datetime', message: 'Departure date and time is required' })
  } else if (new Date(data.departure_datetime) < new Date()) {
    errors.push({ field: 'departure_datetime', message: 'Departure cannot be in the past' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateMissionAssignment(
  driver?: Driver,
  vehicle?: Vehicle,
): ValidationResult {
  const errors: ValidationError[] = []

  if (!driver && !vehicle) {
    errors.push({ field: 'assignment', message: 'Driver or vehicle must be assigned' })
  }

  if (driver && driver.status !== DriverStatus.Active) {
    errors.push({ field: 'driver_id', message: 'Driver must be active to be assigned' })
  }

  if (vehicle && vehicle.status !== VehicleStatus.Active) {
    errors.push({ field: 'vehicle_id', message: 'Vehicle must be active to be assigned' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateMissionCompletion(mission: Mission): ValidationResult {
  const errors: ValidationError[] = []

  if (mission.status !== MissionStatus.InProgress) {
    errors.push({ field: 'status', message: 'Only in-progress missions can be completed' })
  }

  if (!mission.arrival_datetime) {
    errors.push({ field: 'arrival_datetime', message: 'Arrival time is required to complete mission' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// CLIENT VALIDATORS
// ============================================================================

export function validateClientCreation(data: {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Client name is required' })
  }

  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }

  if (!data.phone?.trim()) {
    errors.push({ field: 'phone', message: 'Phone is required' })
  }

  if (!data.address?.trim()) {
    errors.push({ field: 'address', message: 'Address is required' })
  }

  if (!data.city?.trim()) {
    errors.push({ field: 'city', message: 'City is required' })
  }

  if (!data.postal_code?.trim()) {
    errors.push({ field: 'postal_code', message: 'Postal code is required' })
  }

  if (!data.country?.trim()) {
    errors.push({ field: 'country', message: 'Country is required' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// DRIVER VALIDATORS
// ============================================================================

export function validateDriverCreation(data: {
  name: string
  phone: string
  license_number: string
  license_expiry: string
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Driver name is required' })
  }

  if (!data.phone?.trim()) {
    errors.push({ field: 'phone', message: 'Phone is required' })
  }

  if (!data.license_number?.trim()) {
    errors.push({ field: 'license_number', message: 'License number is required' })
  }

  if (!data.license_expiry) {
    errors.push({ field: 'license_expiry', message: 'License expiry date is required' })
  } else if (new Date(data.license_expiry) < new Date()) {
    errors.push({ field: 'license_expiry', message: 'License has expired' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// VEHICLE VALIDATORS
// ============================================================================

export function validateVehicleCreation(data: {
  name: string
  license_plate: string
  mileage_current: number
  next_service_mileage: number
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Vehicle name is required' })
  }

  if (!data.license_plate?.trim()) {
    errors.push({ field: 'license_plate', message: 'License plate is required' })
  }

  if (data.mileage_current < 0) {
    errors.push({ field: 'mileage_current', message: 'Current mileage cannot be negative' })
  }

  if (data.next_service_mileage <= 0) {
    errors.push({ field: 'next_service_mileage', message: 'Next service mileage must be greater than 0' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// EXPENSE VALIDATORS
// ============================================================================

export function validateExpenseCreation(data: {
  amount: number
  expense_date: string
  receipt_attached: boolean
  advanced_by_driver: boolean
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be a valid number greater than 0' })
  }

  if (data.amount > 5000) {
    errors.push({ field: 'amount', message: 'Expense cannot exceed 5,000 EUR' })
  }

  if (!data.expense_date) {
    errors.push({ field: 'expense_date', message: 'Expense date is required' })
  } else if (new Date(data.expense_date) > new Date()) {
    errors.push({ field: 'expense_date', message: 'Expense date cannot be in the future' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// INVOICE VALIDATORS
// ============================================================================

export function validateInvoiceCreation(data: {
  invoice_number: string
  client_id: string
  mission_ids: string[]
  amount_total: number
  issued_date: string
  due_date: string
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.invoice_number?.trim()) {
    errors.push({ field: 'invoice_number', message: 'Invoice number is required' })
  }

  if (!data.client_id?.trim()) {
    errors.push({ field: 'client_id', message: 'Client is required' })
  }

  if (!data.mission_ids || data.mission_ids.length === 0) {
    errors.push({ field: 'mission_ids', message: 'At least one mission is required' })
  }

  if (data.amount_total <= 0) {
    errors.push({ field: 'amount_total', message: 'Invoice amount must be greater than 0' })
  }

  if (!data.issued_date) {
    errors.push({ field: 'issued_date', message: 'Issue date is required' })
  }

  if (!data.due_date) {
    errors.push({ field: 'due_date', message: 'Due date is required' })
  }

  if (data.issued_date && data.due_date) {
    const issuedDate = parseDateInput(data.issued_date)
    const dueDate = parseDateInput(data.due_date)

    if (dueDate.getTime() < issuedDate.getTime()) {
      errors.push({ field: 'due_date', message: 'Due date cannot be before the issue date' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validatePaymentAmount(amountTotal: number, amountAlreadyPaid: number, paymentAmount: number): ValidationResult {
  const errors: ValidationError[] = []

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    errors.push({ field: 'amount', message: 'Payment amount must be greater than 0' })
  }

  if (amountAlreadyPaid + paymentAmount > amountTotal) {
    errors.push({
      field: 'amount',
      message: `Payment exceeds remaining balance of ${amountTotal - amountAlreadyPaid} EUR`,
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validatePaymentCreation(data: {
  amount_total: number
  amount_paid: number
  amount: number
  payment_date: string
  payment_method: string
}): ValidationResult {
  const errors = validatePaymentAmount(
    data.amount_total,
    data.amount_paid,
    data.amount,
  ).errors

  if (!data.payment_method?.trim()) {
    errors.push({ field: 'payment_method', message: 'Payment method is required' })
  }

  if (!data.payment_date) {
    errors.push({ field: 'payment_date', message: 'Payment date is required' })
  } else if (parseDateInput(data.payment_date, true).getTime() > Date.now()) {
    errors.push({ field: 'payment_date', message: 'Payment date cannot be in the future' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// UTILITY VALIDATORS
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  // Basic international phone validation
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function isValidLicensePlate(plate: string): boolean {
  // French license plate format (simplified)
  return plate.length >= 6
}
