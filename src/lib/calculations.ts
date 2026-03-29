import { InvoiceStatus, ReimbursementStatus } from '../types'
import type { Mission, Expense, Invoice, Payment } from '../types'
import type { MissionProfitability, DriverPerformance, VehicleHealthStatus, FinancialSnapshot } from '../types/relationships'

const unsettledReimbursementStatuses = new Set([
  ReimbursementStatus.Pending,
  ReimbursementStatus.Approved,
])

function normalizeNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

// ============================================================================
// MISSION PROFITABILITY CALCULATIONS
// ============================================================================

export function calculateMissionProfitability(
  missionId: string,
  revenue: number,
  estimatedCost: number,
  actualCost?: number,
): MissionProfitability {
  const costToUse = actualCost ?? estimatedCost

  return {
    mission_id: missionId,
    revenue,
    estimated_cost: estimatedCost,
    actual_cost: actualCost,
    estimated_margin: revenue - estimatedCost,
    actual_margin: actualCost !== undefined ? revenue - actualCost : undefined,
    margin_percentage: revenue > 0 ? ((revenue - costToUse) / revenue) * 100 : 0,
    is_profitable: revenue > costToUse,
  }
}

/**
 * Calculate total cost for a mission from its expenses
 */
export function calculateMissionTotalCost(expenses: Expense[]): number {
  return expenses.reduce((sum, exp) => sum + exp.amount, 0)
}

/**
 * Calculate margin percentage for a mission
 */
export function calculateMissionMarginPercentage(revenue: number, cost: number): number {
  if (revenue === 0) return 0
  return ((revenue - cost) / revenue) * 100
}

// ============================================================================
// INVOICE CALCULATIONS
// ============================================================================

export function calculateInvoiceAmountRemaining(amountTotal: number, amountPaid: number): number {
  return Math.max(0, normalizeNumber(amountTotal) - normalizeNumber(amountPaid))
}

export function calculateInvoicePaymentPercentage(amountTotal: number, amountPaid: number): number {
  const total = normalizeNumber(amountTotal)

  if (total === 0) return 0

  return (normalizeNumber(amountPaid) / total) * 100
}

export function calculateTotalPayments(payments: Payment[]): number {
  return payments.reduce((sum, payment) => sum + normalizeNumber(payment.amount), 0)
}

export function calculateInvoiceSummary(invoices: Invoice[]) {
  return invoices.reduce(
    (summary, invoice) => {
      const amountRemaining = calculateInvoiceAmountRemaining(
        invoice.amount_total,
        invoice.amount_paid
      )
      const totalBilled = normalizeNumber(invoice.amount_total)
      const totalCollected = normalizeNumber(invoice.amount_paid)

      summary.totalBilled += totalBilled
      summary.totalCollected += totalCollected
      summary.totalOutstanding += amountRemaining

      if (invoice.status === InvoiceStatus.Draft) {
        summary.draftCount += 1
      }

      if (invoice.status === InvoiceStatus.Sent) {
        summary.sentCount += 1
      }

      if (invoice.status === InvoiceStatus.Partial) {
        summary.partialCount += 1
      }

      if (invoice.status === InvoiceStatus.Paid) {
        summary.paidCount += 1
      }

      if (invoice.status === InvoiceStatus.Overdue) {
        summary.overdueCount += 1
        summary.overdueTotal += amountRemaining
      }

      return summary
    },
    {
      totalBilled: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      overdueTotal: 0,
      draftCount: 0,
      sentCount: 0,
      partialCount: 0,
      paidCount: 0,
      overdueCount: 0,
    }
  )
}

// ============================================================================
// DRIVER PERFORMANCE CALCULATIONS
// ============================================================================

export function calculateDriverPerformance(
  driverId: string,
  missions: Mission[],
  expenses: Expense[],
): DriverPerformance {
  const driverMissions = missions.filter((m) => m.driver_id === driverId)
  const driverExpenses = expenses.filter((e) => e.driver_id === driverId)

  const completedMissions = driverMissions.filter((m) => m.status === 'delivered')
  const totalRevenue = completedMissions.reduce((sum, m) => sum + m.revenue_amount, 0)
  const advancedExpenses = driverExpenses.filter((e) => e.advanced_by_driver)
  const totalAdvanced = advancedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const pendingAdvancedExpenses = advancedExpenses.filter((expense) =>
    unsettledReimbursementStatuses.has(expense.reimbursement_status)
  )
  const inProgressMissions = driverMissions.filter((m) => m.status === 'in_progress')

  return {
    driver_id: driverId,
    missions_completed: completedMissions.length,
    missions_in_progress: inProgressMissions.length,
    total_revenue_driven: totalRevenue,
    total_expenses_advanced: totalAdvanced,
    pending_reimbursements: pendingAdvancedExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    average_mission_value: completedMissions.length > 0 ? totalRevenue / completedMissions.length : 0,
  }
}

// ============================================================================
// VEHICLE HEALTH CALCULATIONS
// ============================================================================

export function calculateVehicleHealthStatus(
  vehicleId: string,
  mileageCurrent: number,
  nextServiceMileage: number,
  lastServiceDate: string | undefined,
  missions: Mission[],
): VehicleHealthStatus {
  const vehicleMissions = missions.filter((m) => m.vehicle_id === vehicleId)
  const completedMissions = vehicleMissions.filter((m) => m.status === 'delivered')
  const mileageUntilService = Math.max(0, nextServiceMileage - mileageCurrent)
  const serviceOverdue = mileageCurrent >= nextServiceMileage
  
  const now = new Date()
  const lastService = lastServiceDate ? new Date(lastServiceDate) : null
  const daysInService = lastService ? Math.floor((now.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24)) : 0

  return {
    vehicle_id: vehicleId,
    mileage_current: mileageCurrent,
    mileage_until_service: mileageUntilService,
    service_overdue: serviceOverdue,
    last_service_date: lastServiceDate,
    missions_completed: completedMissions.length,
    total_maintenance_cost: 0, // Would need maintenance records
    days_in_service: daysInService,
  }
}

// ============================================================================
// FINANCIAL METRICS
// ============================================================================

export function calculateFinancialSnapshot(
  missions: Mission[],
  expenses: Expense[],
  invoices: Invoice[],
  startDate: string,
  endDate: string,
): FinancialSnapshot {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Filter by date range
  const periodMissions = missions.filter((m) => {
    const mDate = new Date(m.created_at)
    return mDate >= start && mDate <= end
  })

  const periodExpenses = expenses.filter((e) => {
    const eDate = new Date(e.expense_date)
    return eDate >= start && eDate <= end
  })

  const periodInvoices = invoices.filter((i) => {
    const iDate = new Date(i.issued_date)
    return iDate >= start && iDate <= end
  })

  const totalRevenue = periodMissions.reduce((sum, m) => sum + m.revenue_amount, 0)
  const totalCosts = periodExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalMargin = totalRevenue - totalCosts

  const invoiceRevenue = periodInvoices.reduce((sum, i) => sum + i.amount_total, 0)
  const outstandingInvoices = periodInvoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + (i.amount_total - i.amount_paid), 0)

  const unpaidAdvances = periodExpenses
    .filter(
      (expense) =>
        expense.advanced_by_driver &&
        unsettledReimbursementStatuses.has(expense.reimbursement_status)
    )
    .reduce((sum, e) => sum + e.amount, 0)

  return {
    period_start: startDate,
    period_end: endDate,
    total_revenue: totalRevenue,
    total_costs: totalCosts,
    total_margin: totalMargin,
    margin_percentage: totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0,
    invoice_revenue: invoiceRevenue,
    outstanding_invoices: outstandingInvoices,
    unpaid_driver_advances: unpaidAdvances,
  }
}

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

export function aggregateExpensesByType(expenses: Expense[]): Record<string, number> {
  const aggregated: Record<string, number> = {}

  expenses.forEach((exp) => {
    const type = exp.type
    aggregated[type] = (aggregated[type] ?? 0) + exp.amount
  })

  return aggregated
}

export function aggregateExpensesByDriver(expenses: Expense[]): Record<string, number> {
  const aggregated: Record<string, number> = {}

  expenses.forEach((exp) => {
    if (exp.driver_id) {
      aggregated[exp.driver_id] = (aggregated[exp.driver_id] ?? 0) + exp.amount
    }
  })

  return aggregated
}

export function calculateTotalRevenueByClient(missions: Mission[], clientId?: string): number {
  const filtered = clientId ? missions.filter((m) => m.client_id === clientId) : missions
  return filtered.reduce((sum, m) => sum + m.revenue_amount, 0)
}

export function calculateTotalCostByMission(expenses: Expense[], missionId: string): number {
  return expenses
    .filter((e) => e.mission_id === missionId)
    .reduce((sum, e) => sum + e.amount, 0)
}

// ============================================================================
// THRESHOLDS AND WARNINGS
// ============================================================================

export interface WarningThresholds {
  driverAdvanceWarning: number
  invoiceOverdueThreshold: number // days
  vehicleMaintenanceWarning: number // km
  lowProfitabilityThreshold: number // percentage
}

export const defaultThresholds: WarningThresholds = {
  driverAdvanceWarning: 500, // EUR
  invoiceOverdueThreshold: 30, // days
  vehicleMaintenanceWarning: 2000, // km
  lowProfitabilityThreshold: 15, // percentage
}

export function shouldWarnDriverAdvance(amount: number, threshold = defaultThresholds.driverAdvanceWarning): boolean {
  return amount >= threshold
}

export function shouldWarnMaintenance(
  mileageCurrent: number,
  nextServiceMileage: number,
  threshold = defaultThresholds.vehicleMaintenanceWarning,
): boolean {
  return mileageCurrent >= nextServiceMileage - threshold
}

export function shouldWarnLowProfitability(
  marginPercentage: number,
  threshold = defaultThresholds.lowProfitabilityThreshold,
): boolean {
  return marginPercentage > 0 && marginPercentage < threshold
}

export function shouldWarnOverdueInvoice(dueDate: string, threshold = defaultThresholds.invoiceOverdueThreshold): boolean {
  const due = new Date(dueDate)
  const today = new Date()
  const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return daysOverdue > threshold
}
