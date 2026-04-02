import type { Invoice, Mission } from '../types/domain'
import { InvoiceStatus, MissionStatus } from '../types/enums'

export const activeMissionStatuses = [
  MissionStatus.Planned,
  MissionStatus.Assigned,
  MissionStatus.InProgress,
] as const

function toSafeNumber(value: number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function isMissionActive(status: Mission['status']) {
  return activeMissionStatuses.includes(status as (typeof activeMissionStatuses)[number])
}

export function getInvoiceBalance(invoice: Invoice) {
  return Math.max(0, toSafeNumber(invoice.amount_total) - toSafeNumber(invoice.amount_paid))
}

export function isInvoiceInCollectionQueue(invoice: Invoice) {
  return (
    getInvoiceBalance(invoice) > 0 &&
    [
      InvoiceStatus.Sent,
      InvoiceStatus.Partial,
      InvoiceStatus.Overdue,
    ].includes(invoice.status as InvoiceStatus)
  )
}

export function getMissionInvoiceMap(invoices: Invoice[]) {
  const lookup = new Map<string, Invoice[]>()

  invoices.forEach((invoice) => {
    invoice.mission_ids.forEach((missionId) => {
      const linkedInvoices = lookup.get(missionId) ?? []
      linkedInvoices.push(invoice)
      lookup.set(missionId, linkedInvoices)
    })
  })

  return lookup
}

export function getMissionMarginSnapshot(mission: Mission) {
  const actualCost = toSafeNumber(mission.actual_cost_amount)
  const estimatedCost = toSafeNumber(mission.estimated_cost_amount)
  const baselineCost = actualCost > 0 ? actualCost : estimatedCost
  const marginAmount = toSafeNumber(mission.revenue_amount) - baselineCost
  const marginRatio =
    mission.revenue_amount > 0 ? marginAmount / toSafeNumber(mission.revenue_amount) : 0
  const isSensitive =
    isMissionActive(mission.status) &&
    mission.revenue_amount > 0 &&
    (marginAmount <= 0 || marginRatio < 0.15)

  return {
    baselineCost,
    marginAmount,
    marginRatio,
    isSensitive,
    sourceLabel: actualCost > 0 ? 'Actual' : 'Estimated',
  }
}

export function mergeSearchParams(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>
) {
  const next = new URLSearchParams(current)

  Object.entries(updates).forEach(([key, value]) => {
    if (!value) {
      next.delete(key)
      return
    }

    next.set(key, value)
  })

  return next
}
