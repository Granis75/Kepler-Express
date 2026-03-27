// Enums for all status types

export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Accountant = 'accountant',
  Driver = 'driver',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Invited = 'invited',
}

export enum ClientStatus {
  Active = 'active',
  Inactive = 'inactive',
  Archived = 'archived',
}

export enum DriverStatus {
  Active = 'active',
  Inactive = 'inactive',
  OnLeave = 'on_leave',
  Suspended = 'suspended',
}

export enum VehicleType {
  Van = 'van',
  Truck = 'truck',
  Car = 'car',
  Trailer = 'trailer',
}

export enum VehicleStatus {
  Active = 'active',
  Watch = 'watch',
  ServiceDue = 'service_due',
  OutOfService = 'out_of_service',
  Retired = 'retired',
}

export enum MissionStatus {
  Planned = 'planned',
  Assigned = 'assigned',
  InProgress = 'in_progress',
  Delivered = 'delivered',
  Issue = 'issue',
  Cancelled = 'cancelled',
}

export enum MissionStopType {
  Pickup = 'pickup',
  Delivery = 'delivery',
  Transfer = 'transfer',
}

export enum ExpenseType {
  Fuel = 'fuel',
  Tolls = 'tolls',
  Maintenance = 'maintenance',
  MissionExpense = 'mission_expense',
  Parking = 'parking',
  Other = 'other',
}

export enum MaintenanceType {
  Scheduled = 'scheduled',
  Unscheduled = 'unscheduled',
  Repair = 'repair',
  Inspection = 'inspection',
}

export enum InvoiceStatus {
  Draft = 'draft',
  Sent = 'sent',
  Partial = 'partial',
  Paid = 'paid',
  Overdue = 'overdue',
  Cancelled = 'cancelled',
}

export enum PaymentMethod {
  BankTransfer = 'bank_transfer',
  Check = 'check',
  Cash = 'cash',
  Card = 'card',
  Other = 'other',
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
}
