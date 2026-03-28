// Domain logic and business rule helpers

import {
  MissionStatus,
  InvoiceStatus,
  VehicleType,
  VehicleStatus,
  DriverStatus,
  ExpenseType,
  ClientStatus,
  MaintenanceType,
  UserRole,
  ReimbursementStatus,
  PaymentMethod,
} from '../types/enums'
import {
  SERVICE_WARNING_THRESHOLD_KM,
  SERVICE_CRITICAL_THRESHOLD_KM,
} from './constants'
import { formatMileage, parseDateInput } from './utils'

// ============================================================================
// STATUS CONFIGURATIONS
// ============================================================================

export const missionStatusConfig = {
  [MissionStatus.Planned]: {
    label: 'Planned',
    color: 'bg-neutral-100 text-neutral-700',
    badge: 'badge-neutral',
    editable: true,
  },
  [MissionStatus.Assigned]: {
    label: 'Assigned',
    color: 'bg-blue-100 text-blue-700',
    badge: 'badge-blue',
    editable: true,
  },
  [MissionStatus.InProgress]: {
    label: 'In progress',
    color: 'bg-blue-100 text-blue-700',
    badge: 'badge-blue',
    editable: false,
  },
  [MissionStatus.Delivered]: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-700',
    badge: 'badge-green',
    editable: false,
  },
  [MissionStatus.Issue]: {
    label: 'Issue',
    color: 'bg-red-100 text-red-700',
    badge: 'badge-red',
    editable: true,
  },
  [MissionStatus.Cancelled]: {
    label: 'Cancelled',
    color: 'bg-neutral-100 text-neutral-700',
    badge: 'badge-neutral',
    editable: false,
  },
}

export const invoiceStatusConfig = {
  [InvoiceStatus.Draft]: {
    label: 'Draft',
    color: 'bg-neutral-100 text-neutral-700',
    badge: 'badge-neutral',
    editable: true,
  },
  [InvoiceStatus.Sent]: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-700',
    badge: 'badge-blue',
    editable: true,
  },
  [InvoiceStatus.Partial]: {
    label: 'Partial',
    color: 'bg-amber-100 text-amber-700',
    badge: 'badge-amber',
    editable: false,
  },
  [InvoiceStatus.Paid]: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700',
    badge: 'badge-green',
    editable: false,
  },
  [InvoiceStatus.Overdue]: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-700',
    badge: 'badge-red',
    editable: true,
  },
  [InvoiceStatus.Cancelled]: {
    label: 'Cancelled',
    color: 'bg-neutral-200 text-neutral-600',
    badge: 'badge-neutral',
    editable: false,
  },
}

export const vehicleStatusConfig = {
  [VehicleStatus.Active]: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    badge: 'badge-green',
  },
  [VehicleStatus.Watch]: {
    label: 'Watch',
    color: 'bg-amber-100 text-amber-700',
    badge: 'badge-amber',
  },
  [VehicleStatus.ServiceDue]: {
    label: 'Service due',
    color: 'bg-red-100 text-red-700',
    badge: 'badge-red',
  },
  [VehicleStatus.OutOfService]: {
    label: 'Out of service',
    color: 'bg-neutral-100 text-neutral-700',
    badge: 'badge-neutral',
  },
  [VehicleStatus.Retired]: {
    label: 'Retired',
    color: 'bg-neutral-100 text-neutral-700',
    badge: 'badge-neutral',
  },
}

export const vehicleTypeConfig = {
  [VehicleType.Van]: {
    label: 'Van',
  },
  [VehicleType.Truck]: {
    label: 'Truck',
  },
  [VehicleType.Car]: {
    label: 'Car',
  },
  [VehicleType.Trailer]: {
    label: 'Trailer',
  },
}

export const driverStatusConfig = {
  [DriverStatus.Active]: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    badge: 'badge-green',
  },
  [DriverStatus.Inactive]: {
    label: 'Inactive',
    color: 'bg-neutral-100 text-neutral-700',
    badge: 'badge-neutral',
  },
  [DriverStatus.OnLeave]: {
    label: 'On leave',
    color: 'bg-amber-100 text-amber-700',
    badge: 'badge-amber',
  },
  [DriverStatus.Suspended]: {
    label: 'Suspended',
    color: 'bg-red-100 text-red-700',
    badge: 'badge-red',
  },
}

export const expenseTypeConfig = {
  [ExpenseType.Fuel]: { label: 'Fuel', color: 'bg-orange-100 text-orange-700' },
  [ExpenseType.Tolls]: { label: 'Tolls', color: 'bg-purple-100 text-purple-700' },
  [ExpenseType.Maintenance]: { label: 'Maintenance', color: 'bg-red-100 text-red-700' },
  [ExpenseType.MissionExpense]: { label: 'Mission expense', color: 'bg-blue-100 text-blue-700' },
  [ExpenseType.Parking]: { label: 'Parking', color: 'bg-indigo-100 text-indigo-700' },
  [ExpenseType.Meal]: { label: 'Meal', color: 'bg-green-100 text-green-700' },
  [ExpenseType.Other]: { label: 'Other', color: 'bg-neutral-100 text-neutral-700' },
}

export const reimbursementStatusConfig = {
  [ReimbursementStatus.Pending]: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700',
    badge: 'badge-amber',
  },
  [ReimbursementStatus.Approved]: {
    label: 'Approved',
    color: 'bg-blue-100 text-blue-700',
    badge: 'badge-blue',
  },
  [ReimbursementStatus.Paid]: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700',
    badge: 'badge-green',
  },
  [ReimbursementStatus.Rejected]: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700',
    badge: 'badge-red',
  },
}

export const maintenanceTypeConfig = {
  [MaintenanceType.Scheduled]: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  [MaintenanceType.Unscheduled]: { label: 'Unscheduled', color: 'bg-amber-100 text-amber-700' },
  [MaintenanceType.Repair]: { label: 'Repair', color: 'bg-red-100 text-red-700' },
  [MaintenanceType.Inspection]: { label: 'Inspection', color: 'bg-green-100 text-green-700' },
}

export const paymentMethodConfig = {
  [PaymentMethod.BankTransfer]: {
    label: 'Bank transfer',
    color: 'bg-blue-100 text-blue-700',
  },
  [PaymentMethod.Check]: {
    label: 'Check',
    color: 'bg-amber-100 text-amber-700',
  },
  [PaymentMethod.Cash]: {
    label: 'Cash',
    color: 'bg-green-100 text-green-700',
  },
  [PaymentMethod.Card]: {
    label: 'Card',
    color: 'bg-indigo-100 text-indigo-700',
  },
  [PaymentMethod.Other]: {
    label: 'Other',
    color: 'bg-neutral-100 text-neutral-700',
  },
}

export const clientStatusConfig = {
  [ClientStatus.Active]: { label: 'Active', color: 'bg-green-100 text-green-700' },
  [ClientStatus.Inactive]: { label: 'Inactive', color: 'bg-neutral-100 text-neutral-700' },
  [ClientStatus.Archived]: { label: 'Archived', color: 'bg-neutral-200 text-neutral-600' },
}

export const userRoleConfig = {
  [UserRole.Admin]: { label: 'Administrator', color: 'bg-red-100 text-red-700' },
  [UserRole.Manager]: { label: 'Manager', color: 'bg-blue-100 text-blue-700' },
  [UserRole.Accountant]: { label: 'Accountant', color: 'bg-green-100 text-green-700' },
  [UserRole.Driver]: { label: 'Driver', color: 'bg-amber-100 text-amber-700' },
}

// ============================================================================
// GETTERS FOR STATUS CONFIGS
// ============================================================================

export function getMissionStatusConfig(status: MissionStatus) {
  return missionStatusConfig[status]
}

export function getMissionStatusOptions() {
  return Object.values(MissionStatus).map((status) => ({
    value: status,
    label: missionStatusConfig[status].label,
  }))
}

export function getMissionListStatus(
  status: MissionStatus
): 'pending' | 'in_progress' | 'delivered' | 'cancelled' {
  if (status === MissionStatus.InProgress) {
    return 'in_progress'
  }

  if (status === MissionStatus.Delivered) {
    return 'delivered'
  }

  if (status === MissionStatus.Cancelled) {
    return 'cancelled'
  }

  return 'pending'
}

export function isActiveMissionStatus(status: MissionStatus) {
  return (
    status === MissionStatus.Planned ||
    status === MissionStatus.Assigned ||
    status === MissionStatus.InProgress
  )
}

export function getInvoiceStatusConfig(status: InvoiceStatus) {
  return invoiceStatusConfig[status]
}

export function getInvoiceStatusLabel(status: InvoiceStatus) {
  return invoiceStatusConfig[status]?.label ?? '—'
}

export function getInvoiceStatusOptions() {
  const supportedStatuses = [
    InvoiceStatus.Draft,
    InvoiceStatus.Sent,
    InvoiceStatus.Partial,
    InvoiceStatus.Paid,
    InvoiceStatus.Overdue,
  ]

  return supportedStatuses.map((status) => ({
    value: status,
    label: getInvoiceStatusLabel(status),
  }))
}

export function getInvoiceWorkflowStatusOptions() {
  return [InvoiceStatus.Draft, InvoiceStatus.Sent].map((status) => ({
    value: status,
    label: getInvoiceStatusLabel(status),
  }))
}

export function getVehicleStatusConfig(status: VehicleStatus) {
  return vehicleStatusConfig[status]
}

export function getVehicleStatusOptions() {
  return Object.values(VehicleStatus).map((status) => ({
    value: status,
    label: vehicleStatusConfig[status].label,
  }))
}

export function getVehicleTypeLabel(type: VehicleType) {
  return vehicleTypeConfig[type]?.label ?? '—'
}

export function getVehicleTypeOptions() {
  return Object.values(VehicleType).map((type) => ({
    value: type,
    label: getVehicleTypeLabel(type),
  }))
}

export function getDriverStatusConfig(status: DriverStatus) {
  return driverStatusConfig[status]
}

export function getExpenseTypeConfig(type: ExpenseType) {
  return expenseTypeConfig[type]
}

export function getExpenseTypeLabel(type: ExpenseType) {
  return expenseTypeConfig[type]?.label ?? '—'
}

export function getReimbursementStatusConfig(status: ReimbursementStatus) {
  return reimbursementStatusConfig[status]
}

export function getReimbursementStatusLabel(status: ReimbursementStatus) {
  return reimbursementStatusConfig[status]?.label ?? '—'
}

export function getMaintenanceTypeConfig(type: MaintenanceType) {
  return maintenanceTypeConfig[type]
}

export function getMaintenanceTypeLabel(type: MaintenanceType) {
  return maintenanceTypeConfig[type]?.label ?? '—'
}

export function getMaintenanceTypeOptions() {
  return Object.values(MaintenanceType).map((type) => ({
    value: type,
    label: getMaintenanceTypeLabel(type),
  }))
}

export function getPaymentMethodConfig(method: PaymentMethod) {
  return paymentMethodConfig[method]
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return paymentMethodConfig[method]?.label ?? '—'
}

export function getPaymentMethodOptions() {
  return Object.values(PaymentMethod).map((method) => ({
    value: method,
    label: getPaymentMethodLabel(method),
  }))
}

export function getClientStatusConfig(status: ClientStatus) {
  return clientStatusConfig[status]
}

export function getUserRoleConfig(role: UserRole) {
  return userRoleConfig[role]
}

// ============================================================================
// BUSINESS LOGIC HELPERS
// ============================================================================

export function canEditMission(status: MissionStatus): boolean {
  return missionStatusConfig[status]?.editable ?? false
}

export function canEditInvoice(status: InvoiceStatus): boolean {
  return invoiceStatusConfig[status]?.editable ?? false
}

export function isInvoiceOverdue(dueDate: string): boolean {
  return parseDateInput(dueDate, true).getTime() < Date.now()
}

export function getInvoiceStatusFromPayment(
  workflowStatus: InvoiceStatus,
  amountTotal: number,
  amountPaid: number,
  dueDate: string,
): InvoiceStatus {
  if (workflowStatus === InvoiceStatus.Cancelled) {
    return InvoiceStatus.Cancelled
  }

  if (workflowStatus === InvoiceStatus.Draft && amountPaid === 0) {
    return InvoiceStatus.Draft
  }

  if (amountPaid === 0) {
    return isInvoiceOverdue(dueDate) ? InvoiceStatus.Overdue : InvoiceStatus.Sent
  }

  if (amountPaid >= amountTotal) {
    return InvoiceStatus.Paid
  }

  return isInvoiceOverdue(dueDate) ? InvoiceStatus.Overdue : InvoiceStatus.Partial
}

export function isVehicleMaintenanceOverdue(mileageCurrent: number, nextServiceMileage: number): boolean {
  return mileageCurrent >= nextServiceMileage
}

export function isVehicleMaintenanceWarning(mileageCurrent: number, nextServiceMileage: number, warningThresholdKm = 2000): boolean {
  return mileageCurrent >= nextServiceMileage - warningThresholdKm
}

export function getVehicleMileageRemaining(
  mileageCurrent: number,
  nextServiceMileage: number,
): number {
  return nextServiceMileage - mileageCurrent
}

export function getVehicleServiceAlert(
  mileageCurrent: number,
  nextServiceMileage: number,
) {
  const mileageRemaining = getVehicleMileageRemaining(mileageCurrent, nextServiceMileage)

  if (mileageRemaining <= 0) {
    return {
      level: 'due' as const,
      label: 'Service overdue',
      detail: `${formatMileage(Math.abs(mileageRemaining))} overdue`,
      surface: 'border-red-200 bg-red-50',
      text: 'text-red-700',
    }
  }

  if (mileageRemaining <= SERVICE_CRITICAL_THRESHOLD_KM) {
    return {
      level: 'critical' as const,
      label: 'Service due soon',
      detail: `${formatMileage(mileageRemaining)} remaining`,
      surface: 'border-red-200 bg-red-50',
      text: 'text-red-700',
    }
  }

  if (mileageRemaining <= SERVICE_WARNING_THRESHOLD_KM) {
    return {
      level: 'warning' as const,
      label: 'Service watch',
      detail: `${formatMileage(mileageRemaining)} remaining`,
      surface: 'border-amber-200 bg-amber-50',
      text: 'text-amber-700',
    }
  }

  return {
    level: 'normal' as const,
    label: 'On schedule',
    detail: `${formatMileage(mileageRemaining)} to service`,
    surface: 'border-gray-200 bg-white',
    text: 'text-gray-600',
  }
}

export function isDriverAdvanceWarning(amountTotal: number, warningThreshold = 500): boolean {
  return amountTotal >= warningThreshold
}

export function isOutstandingReimbursementStatus(status: ReimbursementStatus): boolean {
  return status === ReimbursementStatus.Pending || status === ReimbursementStatus.Approved
}

export function getExpenseListStatus(
  status: ReimbursementStatus
): 'pending' | 'reimbursed' | 'disputed' {
  if (status === ReimbursementStatus.Paid) {
    return 'reimbursed'
  }

  if (status === ReimbursementStatus.Rejected) {
    return 'disputed'
  }

  return 'pending'
}

export function getMissionReferenceFormat(index: number, date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const seq = String(index).padStart(4, '0')
  return `M-${year}${month}${seq}`
}

export function getInvoiceReferenceFormat(index: number, date = new Date()): string {
  const year = date.getFullYear()
  const seq = String(index).padStart(4, '0')
  return `INV-${year}-${seq}`
}

export function canAssignMissionToDriver(missionStatus: MissionStatus, driverId?: string): boolean {
  const assignableStatuses = [MissionStatus.Planned, MissionStatus.Assigned]
  return assignableStatuses.includes(missionStatus) && !!driverId
}

export function canStartMission(missionStatus: MissionStatus): boolean {
  return missionStatus === MissionStatus.Assigned
}

export function canCloseMission(missionStatus: MissionStatus): boolean {
  return missionStatus === MissionStatus.InProgress
}
