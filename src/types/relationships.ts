// Data relationships and computed types

import { Mission, Expense, Invoice, Payment } from './entities'

/**
 * MissionWithRelations includes mission data with related entities
 * Used for detailed mission views
 */
export interface MissionWithRelations extends Mission {
  client?: {
    name: string
    email: string
    vat_number?: string
  }
  driver?: {
    name: string
    phone: string
  }
  vehicle?: {
    name: string
    license_plate: string
  }
  expenses?: Expense[]
  stops?: Array<{
    sequence_number: number
    location: string
    stop_type: string
  }>
}

/**
 * InvoiceWithRelations includes invoice data with related entities
 * Used for invoice details and management
 */
export interface InvoiceWithRelations extends Invoice {
  client?: {
    name: string
    email: string
    vat_number?: string
  }
  missions?: Mission[]
  payments?: Payment[]
}

/**
 * MissionProfitability calculated from mission data
 * Used for business intelligence
 */
export interface MissionProfitability {
  mission_id: string
  revenue: number
  estimated_cost: number
  actual_cost?: number
  estimated_margin: number
  actual_margin?: number
  margin_percentage: number
  is_profitable: boolean
}

/**
 * DriverPerformance aggregated driver metrics
 * Used for driver analytics and dashboard
 */
export interface DriverPerformance {
  driver_id: string
  missions_completed: number
  missions_in_progress: number
  total_revenue_driven: number
  total_expenses_advanced: number
  pending_reimbursements: number
  average_mission_value: number
}

/**
 * VehicleHealthStatus aggregated vehicle metrics
 * Used for fleet management
 */
export interface VehicleHealthStatus {
  vehicle_id: string
  mileage_current: number
  mileage_until_service: number
  service_overdue: boolean
  last_service_date?: string
  missions_completed: number
  total_maintenance_cost: number
  days_in_service: number
}

/**
 * ClientActivitySummary aggregated client metrics
 * Used for client relationship management
 */
export interface ClientActivitySummary {
  client_id: string
  total_missions: number
  missions_completed: number
  total_revenue: number
  unpaid_invoices_count: number
  unpaid_invoices_total: number
  total_spent_invoicing: number
  average_mission_value: number
  last_mission_date?: string
}

/**
 * ExpenseReport for period analysis
 * Used for financial reporting
 */
export interface ExpenseReport {
  period_start: string
  period_end: string
  expense_type: string
  total_amount: number
  count: number
  average_per_expense: number
  driver_advanced: number
  company_paid: number
}

/**
 * FinancialSnapshot for period
 * Used for P&L and dashboard
 */
export interface FinancialSnapshot {
  period_start: string
  period_end: string
  total_revenue: number
  total_costs: number
  total_margin: number
  margin_percentage: number
  invoice_revenue: number
  outstanding_invoices: number
  unpaid_driver_advances: number
}
