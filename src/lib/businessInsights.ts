import type { Client, Expense, Invoice, Mission } from '../types/domain'
import {
  getInvoiceBalance,
  getMissionInvoiceMap,
  getMissionMarginSnapshot,
  isInvoiceInCollectionQueue,
  isMissionActive,
} from './operations'
import { appRoutes } from './routes'
import {
  formatCurrencyWithDecimals,
  formatDate,
  formatDateTime,
  formatPercentage,
} from './utils'

export interface InsightActionTarget {
  pathname: string
  searchParams?: Record<string, string>
}

export interface BusinessInsight {
  id: string
  category: 'uninvoiced' | 'overdue' | 'margin' | 'expenses'
  tone: 'neutral' | 'warning' | 'danger'
  count: number
  title: string
  detail: string
  actionLabel: string
  action: InsightActionTarget
  priority: number
}

export interface OverdueInvoiceClientGroup {
  clientId: string
  clientName: string
  invoices: Invoice[]
  overdueAmount: number
}

export interface DashboardCashMetrics {
  cashBlockedTotal: number
  collectionQueueCount: number
  revenueNotInvoicedTotal: number
  uninvoicedMissionCount: number
  overdueCount: number
  overdueTotal: number
  pendingExpenseCount: number
  pendingExpenseAmount: number
}

export interface DashboardActionQueueItem {
  id: string
  title: string
  detail: string
  actionLabel: string
  tone: 'neutral' | 'warning' | 'danger'
  action: InsightActionTarget
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural
}

function sortCollectionInvoices(left: Invoice, right: Invoice) {
  if (left.status === 'overdue' && right.status !== 'overdue') {
    return -1
  }

  if (left.status !== 'overdue' && right.status === 'overdue') {
    return 1
  }

  const dueDateDifference = new Date(left.due_date).getTime() - new Date(right.due_date).getTime()

  if (dueDateDifference !== 0) {
    return dueDateDifference
  }

  return getInvoiceBalance(right) - getInvoiceBalance(left)
}

function sortUninvoicedMissions(left: Mission, right: Mission) {
  const revenueDifference = Number(right.revenue_amount ?? 0) - Number(left.revenue_amount ?? 0)

  if (revenueDifference !== 0) {
    return revenueDifference
  }

  return new Date(left.departure_datetime).getTime() - new Date(right.departure_datetime).getTime()
}

function getRiskyExpensePriority(expense: Expense) {
  if (expense.approval_status === 'pending' && expense.advanced_by_driver) {
    return 4
  }

  if (expense.approval_status === 'pending') {
    return 3
  }

  if (!expense.receipt_present) {
    return 2
  }

  return 1
}

function sortExpenseReviewItems(left: Expense, right: Expense) {
  const priorityDifference = getRiskyExpensePriority(right) - getRiskyExpensePriority(left)

  if (priorityDifference !== 0) {
    return priorityDifference
  }

  const amountDifference = Number(right.amount ?? 0) - Number(left.amount ?? 0)

  if (amountDifference !== 0) {
    return amountDifference
  }

  return new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime()
}

function sortMarginRiskMissions(left: Mission, right: Mission) {
  const leftMargin = getMissionMarginSnapshot(left)
  const rightMargin = getMissionMarginSnapshot(right)

  if (leftMargin.marginRatio !== rightMargin.marginRatio) {
    return leftMargin.marginRatio - rightMargin.marginRatio
  }

  return Number(right.revenue_amount ?? 0) - Number(left.revenue_amount ?? 0)
}

function getClientNameById(clients: Client[]) {
  return new Map(clients.map((client) => [client.client_id, client.name] as const))
}

function getMissionById(missions: Mission[]) {
  return new Map(missions.map((mission) => [mission.mission_id, mission] as const))
}

export function getCollectionQueueInvoices(invoices: Invoice[]) {
  return [...invoices].filter((invoice) => isInvoiceInCollectionQueue(invoice)).sort(sortCollectionInvoices)
}

export function getOverdueInvoices(invoices: Invoice[]) {
  return [...invoices]
    .filter((invoice) => invoice.status === 'overdue' && getInvoiceBalance(invoice) > 0)
    .sort(sortCollectionInvoices)
}

export function getActiveUninvoicedMissions(missions: Mission[], invoices: Invoice[]) {
  const missionInvoiceMap = getMissionInvoiceMap(invoices)

  return [...missions]
    .filter(
      (mission) =>
        isMissionActive(mission.status) &&
        (missionInvoiceMap.get(mission.mission_id) ?? []).length === 0
    )
    .sort(sortUninvoicedMissions)
}

export function getMarginSensitiveMissions(missions: Mission[]) {
  return [...missions]
    .filter((mission) => getMissionMarginSnapshot(mission).isSensitive)
    .sort(sortMarginRiskMissions)
}

export function getExpensesNeedingReview(expenses: Expense[]) {
  return [...expenses]
    .filter((expense) => expense.approval_status === 'pending' || !expense.receipt_present)
    .sort(sortExpenseReviewItems)
}

export function groupOverdueInvoicesByClient(
  invoices: Invoice[],
  clients: Client[]
): OverdueInvoiceClientGroup[] {
  const clientNameById = getClientNameById(clients)
  const groups = new Map<string, OverdueInvoiceClientGroup>()

  getOverdueInvoices(invoices).forEach((invoice) => {
    const existingGroup = groups.get(invoice.client_id) ?? {
      clientId: invoice.client_id,
      clientName: clientNameById.get(invoice.client_id) ?? 'Unknown client',
      invoices: [],
      overdueAmount: 0,
    }

    existingGroup.invoices.push(invoice)
    existingGroup.overdueAmount += getInvoiceBalance(invoice)
    groups.set(invoice.client_id, existingGroup)
  })

  return [...groups.values()].sort((left, right) => {
    if (left.invoices.length !== right.invoices.length) {
      return right.invoices.length - left.invoices.length
    }

    return right.overdueAmount - left.overdueAmount
  })
}

export function getDashboardCashMetrics({
  missions,
  invoices,
  expenses,
}: {
  missions: Mission[]
  invoices: Invoice[]
  expenses: Expense[]
}): DashboardCashMetrics {
  const collectionQueue = getCollectionQueueInvoices(invoices)
  const overdueInvoices = getOverdueInvoices(invoices)
  const uninvoicedActiveMissions = getActiveUninvoicedMissions(missions, invoices)
  const pendingExpenses = expenses.filter((expense) => expense.approval_status === 'pending')

  return {
    cashBlockedTotal: collectionQueue.reduce((sum, invoice) => sum + getInvoiceBalance(invoice), 0),
    collectionQueueCount: collectionQueue.length,
    revenueNotInvoicedTotal: uninvoicedActiveMissions.reduce(
      (sum, mission) => sum + Number(mission.revenue_amount ?? 0),
      0
    ),
    uninvoicedMissionCount: uninvoicedActiveMissions.length,
    overdueCount: overdueInvoices.length,
    overdueTotal: overdueInvoices.reduce((sum, invoice) => sum + getInvoiceBalance(invoice), 0),
    pendingExpenseCount: pendingExpenses.length,
    pendingExpenseAmount: pendingExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount ?? 0),
      0
    ),
  }
}

export function getDashboardActionQueue({
  missions,
  invoices,
  expenses,
  clients,
  limit = 5,
}: {
  missions: Mission[]
  invoices: Invoice[]
  expenses: Expense[]
  clients: Client[]
  limit?: number
}) {
  const clientNameById = getClientNameById(clients)
  const missionById = getMissionById(missions)
  const queuedMissionIds = new Set<string>()
  const actions: DashboardActionQueueItem[] = []

  getCollectionQueueInvoices(invoices)
    .slice(0, 2)
    .forEach((invoice) => {
      const outstanding = getInvoiceBalance(invoice)
      const clientName = clientNameById.get(invoice.client_id) ?? 'Unknown client'

      actions.push({
        id: `invoice-${invoice.invoice_id}`,
        title: `Follow up ${invoice.invoice_number}`,
        detail: `${formatCurrencyWithDecimals(outstanding)} ${
          invoice.status === 'overdue' ? 'overdue' : 'still open'
        } for ${clientName} · due ${formatDate(invoice.due_date)}`,
        actionLabel: 'Open invoice',
        tone: invoice.status === 'overdue' ? 'danger' : 'warning',
        action: {
          pathname: appRoutes.invoices,
          searchParams: {
            queue: invoice.status === 'overdue' ? 'overdue' : 'unpaid',
            focus: invoice.invoice_id,
          },
        },
      })
    })

  getActiveUninvoicedMissions(missions, invoices)
    .slice(0, 2)
    .forEach((mission) => {
      queuedMissionIds.add(mission.mission_id)

      actions.push({
        id: `mission-${mission.mission_id}`,
        title: `Invoice mission ${mission.reference}`,
        detail: `${formatCurrencyWithDecimals(
          mission.revenue_amount
        )} not yet billed · departs ${formatDateTime(mission.departure_datetime)}`,
        actionLabel: 'Create invoice',
        tone: mission.status === 'issue' ? 'danger' : 'warning',
        action: {
          pathname: appRoutes.invoices,
          searchParams: {
            mission: mission.mission_id,
            compose: 'new',
          },
        },
      })
    })

  getExpensesNeedingReview(expenses)
    .slice(0, 1)
    .forEach((expense) => {
      const linkedMission = expense.mission_id ? missionById.get(expense.mission_id) ?? null : null
      const statusLine =
        expense.approval_status === 'pending'
          ? expense.advanced_by_driver
            ? 'driver advance pending'
            : 'approval pending'
          : 'receipt missing'

      actions.push({
        id: `expense-${expense.expense_id}`,
        title: linkedMission
          ? `Review expense for ${linkedMission.reference}`
          : `Review ${expense.expense_type} expense`,
        detail: `${formatCurrencyWithDecimals(expense.amount)} ${statusLine}${
          !expense.receipt_present && expense.approval_status === 'pending'
            ? ' · receipt missing'
            : ''
        }`,
        actionLabel: 'Open expense',
        tone: expense.approval_status === 'pending' ? 'warning' : 'danger',
        action: {
          pathname: appRoutes.expenses,
          searchParams: {
            queue: expense.approval_status === 'pending' ? 'pending' : 'missing-receipt',
            focus: expense.expense_id,
          },
        },
      })
    })

  getMarginSensitiveMissions(missions).forEach((mission) => {
    if (actions.length >= limit || queuedMissionIds.has(mission.mission_id)) {
      return
    }

    const margin = getMissionMarginSnapshot(mission)

    actions.push({
      id: `margin-${mission.mission_id}`,
      title: `Review margin on ${mission.reference}`,
      detail: `${formatPercentage(margin.marginRatio * 100, 0)} margin on ${formatCurrencyWithDecimals(
        mission.revenue_amount
      )} revenue`,
      actionLabel: 'Open mission',
      tone: margin.marginAmount <= 0 || mission.status === 'issue' ? 'danger' : 'warning',
      action: {
        pathname: appRoutes.missions,
        searchParams: {
          queue: 'margin',
          focus: mission.mission_id,
        },
      },
    })
  })

  return actions.slice(0, limit)
}

export function getBusinessInsights({
  missions,
  invoices,
  expenses,
  clients,
}: {
  missions: Mission[]
  invoices: Invoice[]
  expenses: Expense[]
  clients: Client[]
}) {
  const activeMissions = missions.filter((mission) => isMissionActive(mission.status))
  const insights: BusinessInsight[] = []
  const uninvoicedActiveMissions = getActiveUninvoicedMissions(missions, invoices)

  if (uninvoicedActiveMissions.length > 0) {
    const revenueAwaitingBilling = uninvoicedActiveMissions.reduce(
      (sum, mission) => sum + Number(mission.revenue_amount ?? 0),
      0
    )

    insights.push({
      id: 'uninvoiced-missions',
      category: 'uninvoiced',
      tone: uninvoicedActiveMissions.length >= 3 ? 'danger' : 'warning',
      count: uninvoicedActiveMissions.length,
      title: `${uninvoicedActiveMissions.length} active ${pluralize(
        uninvoicedActiveMissions.length,
        'mission'
      )} ${uninvoicedActiveMissions.length === 1 ? 'is' : 'are'} not invoiced yet`,
      detail: `${formatCurrencyWithDecimals(revenueAwaitingBilling)} still unconverted into billing`,
      actionLabel: 'Open uninvoiced missions',
      action: {
        pathname: appRoutes.missions,
        searchParams: { queue: 'uninvoiced' },
      },
      priority: 95,
    })
  }

  const overdueInvoices = getOverdueInvoices(invoices)

  if (overdueInvoices.length > 0) {
    const overdueGroups = groupOverdueInvoicesByClient(invoices, clients)
    const topGroup = overdueGroups[0] ?? null
    const totalOverdueAmount = overdueInvoices.reduce(
      (sum, invoice) => sum + getInvoiceBalance(invoice),
      0
    )

    const action: InsightActionTarget =
      topGroup && (topGroup.invoices.length > 1 || overdueGroups.length === 1)
        ? {
            pathname: appRoutes.invoices,
            searchParams: {
              queue: 'overdue',
              client: topGroup.clientId,
            },
          }
        : {
            pathname: appRoutes.invoices,
            searchParams: { queue: 'overdue' },
          }

    const title =
      topGroup && topGroup.invoices.length > 1
        ? `${topGroup.invoices.length} overdue invoices for ${topGroup.clientName}`
        : `${overdueInvoices.length} overdue ${pluralize(overdueInvoices.length, 'invoice')}`

    const detail =
      topGroup && topGroup.invoices.length > 1
        ? `${formatCurrencyWithDecimals(topGroup.overdueAmount)} waiting in collection`
        : overdueGroups.length > 1
          ? `${formatCurrencyWithDecimals(totalOverdueAmount)} overdue across ${overdueGroups.length} clients`
          : `${formatCurrencyWithDecimals(totalOverdueAmount)} waiting in collection`

    insights.push({
      id: 'overdue-concentration',
      category: 'overdue',
      tone: 'danger',
      count: overdueInvoices.length,
      title,
      detail,
      actionLabel: 'Review overdue invoices',
      action,
      priority: 100,
    })
  }

  const marginSensitiveMissions = getMarginSensitiveMissions(activeMissions)

  if (marginSensitiveMissions.length > 0) {
    const revenueAtRisk = marginSensitiveMissions.reduce(
      (sum, mission) => sum + Number(mission.revenue_amount ?? 0),
      0
    )

    insights.push({
      id: 'margin-risk',
      category: 'margin',
      tone: marginSensitiveMissions.length >= 4 ? 'danger' : 'warning',
      count: marginSensitiveMissions.length,
      title: `${marginSensitiveMissions.length} ${pluralize(
        marginSensitiveMissions.length,
        'mission'
      )} ${marginSensitiveMissions.length === 1 ? 'is' : 'are'} below margin threshold`,
      detail: `${formatCurrencyWithDecimals(revenueAtRisk)} of active revenue is running thin`,
      actionLabel: 'Review margin risk',
      action: {
        pathname: appRoutes.missions,
        searchParams: { queue: 'margin' },
      },
      priority: 85,
    })
  }

  const pendingExpenses = expenses.filter((expense) => expense.approval_status === 'pending')
  const missingReceiptExpenses = expenses.filter((expense) => !expense.receipt_present)

  if (pendingExpenses.length > 0 || missingReceiptExpenses.length > 0) {
    const pendingAmount = pendingExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount ?? 0),
      0
    )
    const missingReceiptAmount = missingReceiptExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount ?? 0),
      0
    )
    const shouldLeadWithPending = pendingExpenses.length > 0

    insights.push({
      id: 'expense-control',
      category: 'expenses',
      tone: shouldLeadWithPending ? 'warning' : 'danger',
      count: shouldLeadWithPending ? pendingExpenses.length : missingReceiptExpenses.length,
      title: shouldLeadWithPending
        ? `${pendingExpenses.length} ${pluralize(pendingExpenses.length, 'expense')} still ${
            pendingExpenses.length === 1 ? 'needs' : 'need'
          } approval`
        : `${missingReceiptExpenses.length} ${pluralize(
            missingReceiptExpenses.length,
            'expense'
          )} ${missingReceiptExpenses.length === 1 ? 'is' : 'are'} missing receipts`,
      detail:
        pendingExpenses.length > 0 && missingReceiptExpenses.length > 0
          ? `${formatCurrencyWithDecimals(
              pendingAmount
            )} waiting on review, including ${missingReceiptExpenses.length} without receipts`
          : shouldLeadWithPending
            ? `${formatCurrencyWithDecimals(pendingAmount)} waiting on ops or finance review`
            : `${formatCurrencyWithDecimals(
                missingReceiptAmount
              )} still missing supporting receipt documentation`,
      actionLabel:
        pendingExpenses.length > 0 ? 'Review pending expenses' : 'Review missing receipts',
      action: {
        pathname: appRoutes.expenses,
        searchParams: {
          queue: pendingExpenses.length > 0 ? 'pending' : 'missing-receipt',
        },
      },
      priority: 75,
    })
  }

  return insights.sort((left, right) => right.priority - left.priority)
}
