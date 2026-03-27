// Domain logic and business rule helpers

import {
  MissionStatus,
  InvoiceStatus,
  VehicleStatus,
  DriverStatus,
  ExpenseType,
  ClientStatus,
  MaintenanceType,
  UserRole,
} from '../types/enums'

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
  [ExpenseType.MissionExpense]: { label: 'Mission', color: 'bg-blue-100 text-blue-700' },
  [ExpenseType.Parking]: { label: 'Parking', color: 'bg-indigo-100 text-indigo-700' },
  [ExpenseType.Other]: { label: 'Other', color: 'bg-neutral-100 text-neutral-700' },
}

export const maintenanceTypeConfig = {
  [MaintenanceType.Scheduled]: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  [MaintenanceType.Unscheduled]: { label: 'Unscheduled', color: 'bg-amber-100 text-amber-700' },
  [MaintenanceType.Repair]: { label: 'Repair', color: 'bg-red-100 text-red-700' },
  [MaintenanceType.Inspection]: { label: 'Inspection', color: 'bg-green-100 text-green-700' },
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

export function getInvoiceStatusConfig(status: InvoiceStatus) {
  return invoiceStatusConfig[status]
}

export function getVehicleStatusConfig(status: VehicleStatus) {
  return vehicleStatusConfig[status]
}

export function getDriverStatusConfig(status: DriverStatus) {
  return driverStatusConfig[status]
}

export function getExpenseTypeConfig(type: ExpenseType) {
  return expenseTypeConfig[type]
}

export function getMaintenanceTypeConfig(type: MaintenanceType) {
  return maintenanceTypeConfig[type]
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
  return new Date(dueDate) < new Date()
}

export function getInvoiceStatusFromPayment(amountTotal: number, amountPaid: number, dueDate: string): InvoiceStatus {
  if (amountPaid === 0) {
    return isInvoiceOverdue(dueDate) ? InvoiceStatus.Overdue : InvoiceStatus.Sent
  }
  if (amountPaid >= amountTotal) {
    return InvoiceStatus.Paid
  }
  return InvoiceStatus.Partial
}

export function isVehicleMaintenanceOverdue(mileageCurrent: number, nextServiceMileage: number): boolean {
  return mileageCurrent >= nextServiceMileage
}

export function isVehicleMaintenanceWarning(mileageCurrent: number, nextServiceMileage: number, warningThresholdKm = 2000): boolean {
  return mileageCurrent >= nextServiceMileage - warningThresholdKm
}

export function isDriverAdvanceWarning(amountTotal: number, warningThreshold = 500): boolean {
  return amountTotal >= warningThreshold
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
