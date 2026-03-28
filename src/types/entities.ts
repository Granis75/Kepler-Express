import {
  UserRole,
  UserStatus,
  ClientStatus,
  DriverStatus,
  VehicleType,
  VehicleStatus,
  MissionStatus,
  MissionStopType,
  ExpenseType,
  MaintenanceType,
  InvoiceStatus,
  PaymentMethod,
  Currency,
  ReimbursementStatus,
} from './enums'

// ============================================================================
// PROFILE / USER
// ============================================================================

export interface Profile {
  profile_id: string
  user_id: string // from Supabase auth
  organization_id: string
  role: UserRole
  name: string
  email: string
  phone?: string
  status: UserStatus
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface CreateProfileInput {
  user_id: string
  organization_id: string
  role: UserRole
  name: string
  email: string
  phone?: string
}

// ============================================================================
// CLIENT
// ============================================================================

export interface Client {
  client_id: string
  organization_id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  vat_number?: string
  status: ClientStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateClientInput {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  vat_number?: string
  notes?: string
}

// ============================================================================
// DRIVER
// ============================================================================

export interface Driver {
  driver_id: string
  organization_id: string
  name: string
  email?: string
  phone: string
  license_number: string
  license_expiry: string
  status: DriverStatus
  date_of_birth?: string
  created_at: string
  updated_at: string
}

export interface CreateDriverInput {
  name: string
  email?: string
  phone: string
  license_number: string
  license_expiry: string
  date_of_birth?: string
}

// ============================================================================
// VEHICLE
// ============================================================================

export interface Vehicle {
  vehicle_id: string
  organization_id: string
  name: string
  license_plate: string
  registration_number?: string
  vehicle_type: VehicleType
  status: VehicleStatus
  mileage_current: number
  mileage_last_service?: number
  next_service_mileage: number
  capacity_kg?: number
  capacity_m3?: number
  last_service_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateVehicleInput {
  name: string
  license_plate: string
  registration_number?: string
  vehicle_type: VehicleType
  status: VehicleStatus
  mileage_current: number
  next_service_mileage: number
  notes?: string
  capacity_kg?: number
  capacity_m3?: number
}

// ============================================================================
// MISSION
// ============================================================================

export interface Mission {
  mission_id: string
  organization_id: string
  client_id: string
  driver_id?: string
  vehicle_id?: string
  reference: string
  status: MissionStatus
  revenue_amount: number
  estimated_cost_amount: number
  actual_cost_amount?: number
  departure_location: string
  arrival_location: string
  departure_datetime: string
  arrival_datetime?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateMissionInput {
  client_id: string
  driver_id?: string
  vehicle_id?: string
  revenue_amount: number
  estimated_cost_amount: number
  departure_location: string
  arrival_location: string
  departure_datetime: string
  notes?: string
}

export interface UpdateMissionInput {
  driver_id?: string
  vehicle_id?: string
  status?: MissionStatus
  arrival_datetime?: string
  actual_cost_amount?: number
  notes?: string
}

// ============================================================================
// MISSION STOP (optional waypoints)
// ============================================================================

export interface MissionStop {
  stop_id: string
  mission_id: string
  sequence_number: number
  location: string
  stop_type: MissionStopType
  completed_at?: string
  created_at: string
}

export interface CreateMissionStopInput {
  mission_id: string
  sequence_number: number
  location: string
  stop_type: MissionStopType
}

// ============================================================================
// EXPENSE
// ============================================================================

export interface Expense {
  expense_id: string
  organization_id: string
  mission_id?: string
  driver_id?: string
  vehicle_id?: string
  type: ExpenseType
  amount: number
  currency: Currency
  advanced_by_driver: boolean
  reimbursement_status: ReimbursementStatus
  receipt_attached: boolean
  description?: string
  expense_date: string
  created_at: string
  updated_at: string
}

export interface CreateExpenseInput {
  mission_id?: string
  driver_id?: string
  vehicle_id?: string
  type: ExpenseType
  amount: number
  currency?: Currency
  advanced_by_driver: boolean
  reimbursement_status?: ReimbursementStatus
  receipt_attached: boolean
  description?: string
  expense_date: string
}

// ============================================================================
// MAINTENANCE RECORD
// ============================================================================

export interface MaintenanceRecord {
  maintenance_id: string
  vehicle_id: string
  type: MaintenanceType
  notes?: string
  cost_amount: number
  currency: Currency
  mileage_at_service: number
  next_service_mileage: number
  service_date: string
  completed_at?: string
  created_at: string
  updated_at?: string
}

export interface CreateMaintenanceInput {
  vehicle_id: string
  type: MaintenanceType
  notes?: string
  cost_amount: number
  currency?: Currency
  mileage_at_service: number
  next_service_mileage: number
  service_date: string
}

// ============================================================================
// INVOICE
// ============================================================================

export interface Invoice {
  invoice_id: string
  organization_id: string
  client_id: string
  invoice_number: string
  status: InvoiceStatus
  mission_ids: string[]
  amount_total: number
  amount_paid: number
  currency: Currency
  issued_date: string
  due_date: string
  sent_date?: string
  paid_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateInvoiceInput {
  client_id: string
  mission_ids: string[]
  amount_total: number
  currency?: Currency
  issued_date: string
  due_date: string
  notes?: string
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus
  amount_paid?: number
  sent_date?: string
  paid_date?: string
  notes?: string
}

// ============================================================================
// PAYMENT
// ============================================================================

export interface Payment {
  payment_id: string
  invoice_id: string
  amount: number
  currency: Currency
  payment_method: PaymentMethod
  payment_date: string
  reference?: string
  notes?: string
  created_at: string
}

export interface CreatePaymentInput {
  invoice_id: string
  amount: number
  currency?: Currency
  payment_method: PaymentMethod
  payment_date: string
  reference?: string
  notes?: string
}

// ============================================================================
// DASHBOARD / AGGREGATES
// ============================================================================

export interface MissionMetrics {
  total_missions: number
  missions_delivered: number
  missions_in_progress: number
  missions_planned: number
  missions_with_issues: number
}

export interface FinancialMetrics {
  total_revenue: number
  total_estimated_costs: number
  total_actual_costs: number
  estimated_margin: number
  actual_margin?: number
  margin_percentage: number
}

export interface OperationalMetrics {
  driver_advances_total: number
  driver_advances_pending: number
  overdue_invoices_total: number
  overdue_invoices_count: number
  vehicles_needing_maintenance: number
}

export interface DashboardData {
  missions: MissionMetrics
  financial: FinancialMetrics
  operational: OperationalMetrics
}

// ============================================================================
// ORGANIZATION
// ============================================================================

export interface Organization {
  organization_id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  vat_number?: string
  logo_url?: string
  created_at: string
  updated_at: string
}
