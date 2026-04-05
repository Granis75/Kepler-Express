import { useMemo } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import clsx from 'clsx'
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import {
  ActiveFilterBar,
  PageLoadingSkeleton,
  SectionCard,
  StatePanel,
  StatCard,
  StatusBadge,
} from '../components/WorkspaceUi'
import { useClients, useExpenses, useInvoices, useMissions } from '../hooks'
import {
  getInvoiceBalance,
  getMissionInvoiceMap,
  getMissionMarginSnapshot,
  isMissionActive,
  mergeSearchParams,
} from '../lib/operations'
import {
  appRoutes,
  getInvoiceDetailRoute,
  getMissionDetailRoute,
} from '../lib/routes'
import {
  formatCurrencyWithDecimals,
  formatDate,
  formatDateTime,
  formatPercentage,
  toSearchValue,
  truncateString,
} from '../lib/utils'
import type { Expense, Invoice, Mission } from '../types/domain'
import { MissionStatus } from '../types/enums'

type AssignmentQueue = 'all' | 'active' | 'issues' | 'uninvoiced' | 'margin'

interface DerivedAssignment {
  driverKey: string
  driverName: string
  missions: Mission[]
  expenses: Expense[]
  clientCount: number
  missionsCount: number
  activeMissionsCount: number
  deliveredMissionsCount: number
  issueMissionsCount: number
  uninvoicedActiveCount: number
  marginSensitiveCount: number
  actualCostMissionCount: number
  revenueGenerated: number
  estimatedCostGenerated: number
  actualCostGenerated: number
  costBasisGenerated: number
  costBasisLabel: string
  expensesGenerated: number
  marginGenerated: number
  marginRatio: number
  hasIssue: boolean
  hasActiveUninvoiced: boolean
  hasMarginSensitive: boolean
  hasHighRevenue: boolean
  mostRecentMission: Mission | null
  nextUpcomingMission: Mission | null
}

const assignmentQueueOptions = [
  { value: 'all', label: 'All assignments' },
  { value: 'active', label: 'Active only' },
  { value: 'issues', label: 'Issue only' },
  { value: 'uninvoiced', label: 'Uninvoiced work' },
  { value: 'margin', label: 'Margin sensitive' },
] as const

const inlineButtonClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const primaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const secondaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const tertiaryButtonClasses =
  'inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

function normalizeDriverKey(name?: string | null) {
  return toSearchValue(name).replace(/\s+/g, ' ').trim()
}

function formatDriverName(name?: string | null) {
  return (name ?? '').replace(/\s+/g, ' ').trim()
}

function missionTone(status: Mission['status']) {
  switch (status) {
    case MissionStatus.Delivered:
      return 'success' as const
    case MissionStatus.InProgress:
      return 'info' as const
    case MissionStatus.Issue:
      return 'danger' as const
    case MissionStatus.Assigned:
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function invoiceTone(status: Invoice['status']) {
  switch (status) {
    case 'partial':
      return 'warning' as const
    case 'overdue':
      return 'danger' as const
    case 'sent':
      return 'info' as const
    case 'paid':
      return 'success' as const
    default:
      return 'neutral' as const
  }
}

function approvalTone(status: Expense['approval_status']) {
  switch (status) {
    case 'paid':
      return 'success' as const
    case 'approved':
      return 'info' as const
    case 'rejected':
      return 'danger' as const
    default:
      return 'warning' as const
  }
}

const missionStatusLabels: Record<Mission['status'], string> = {
  planned: 'Planned',
  assigned: 'Assigned',
  in_progress: 'In progress',
  delivered: 'Delivered',
  issue: 'Issue',
  cancelled: 'Cancelled',
}

const invoiceStatusLabels: Record<Invoice['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

const approvalStatusLabels: Record<Expense['approval_status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
}

const expenseTypeLabels: Record<Expense['expense_type'], string> = {
  fuel: 'Fuel',
  tolls: 'Tolls',
  mission: 'Mission',
  maintenance: 'Maintenance',
  other: 'Other',
}

function sortMissionsForAssignment(left: Mission, right: Mission) {
  if (isMissionActive(left.status) && !isMissionActive(right.status)) {
    return -1
  }

  if (!isMissionActive(left.status) && isMissionActive(right.status)) {
    return 1
  }

  return (
    new Date(right.departure_datetime).getTime() -
    new Date(left.departure_datetime).getTime()
  )
}

function getQueueLabel(queue: AssignmentQueue) {
  return assignmentQueueOptions.find((option) => option.value === queue)?.label ?? 'All assignments'
}

function getCostBasisLabel(actualCostMissionCount: number, missionsCount: number) {
  if (missionsCount === 0 || actualCostMissionCount === 0) {
    return 'Estimated mission cost basis'
  }

  if (actualCostMissionCount === missionsCount) {
    return 'Actual mission cost basis'
  }

  return 'Mixed mission cost basis'
}

export function Assignments() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const missionsQuery = useMissions()
  const expensesQuery = useExpenses()
  const invoicesQuery = useInvoices()
  const clientsQuery = useClients()

  const missions = missionsQuery.data ?? []
  const expenses = expensesQuery.data ?? []
  const invoices = invoicesQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const isLoading =
    missionsQuery.isLoading ||
    expensesQuery.isLoading ||
    invoicesQuery.isLoading ||
    clientsQuery.isLoading
  const error =
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    (expensesQuery.error instanceof Error && expensesQuery.error.message) ||
    (invoicesQuery.error instanceof Error && invoicesQuery.error.message) ||
    (clientsQuery.error instanceof Error && clientsQuery.error.message) ||
    null

  const rawQueue = searchParams.get('queue')
  const queue: AssignmentQueue = assignmentQueueOptions.some(
    (option) => option.value === rawQueue
  )
    ? (rawQueue as AssignmentQueue)
    : 'all'
  const searchQuery = searchParams.get('q') ?? ''
  const selectedDriverKey = searchParams.get('driver') ?? ''

  const missionById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission] as const)),
    [missions]
  )

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.client_id, client.name] as const)),
    [clients]
  )

  const missionInvoiceMap = useMemo(() => getMissionInvoiceMap(invoices), [invoices])

  const assignments = useMemo<DerivedAssignment[]>(() => {
    const groups = new Map<
      string,
      {
        driverKey: string
        driverName: string
        missions: Mission[]
        expenses: Expense[]
        revenueGenerated: number
        estimatedCostGenerated: number
        actualCostGenerated: number
        costBasisGenerated: number
        expensesGenerated: number
        marginGenerated: number
        activeMissionsCount: number
        deliveredMissionsCount: number
        issueMissionsCount: number
        uninvoicedActiveCount: number
        marginSensitiveCount: number
        actualCostMissionCount: number
        clientIds: Set<string>
      }
    >()

    missions.forEach((mission) => {
      const driverName = formatDriverName(mission.driver_name)
      const driverKey = normalizeDriverKey(driverName)

      if (!driverKey) {
        return
      }

      const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
      const margin = getMissionMarginSnapshot(mission)
      const group = groups.get(driverKey) ?? {
        driverKey,
        driverName,
        missions: [],
        expenses: [],
        revenueGenerated: 0,
        estimatedCostGenerated: 0,
        actualCostGenerated: 0,
        costBasisGenerated: 0,
        expensesGenerated: 0,
        marginGenerated: 0,
        activeMissionsCount: 0,
        deliveredMissionsCount: 0,
        issueMissionsCount: 0,
        uninvoicedActiveCount: 0,
        marginSensitiveCount: 0,
        actualCostMissionCount: 0,
        clientIds: new Set<string>(),
      }

      if (!groups.has(driverKey)) {
        groups.set(driverKey, group)
      }

      group.missions.push(mission)
      group.clientIds.add(mission.client_id)
      group.revenueGenerated += Number(mission.revenue_amount ?? 0)
      group.estimatedCostGenerated += Number(mission.estimated_cost_amount ?? 0)
      group.actualCostGenerated += Number(mission.actual_cost_amount ?? 0)
      group.costBasisGenerated += margin.baselineCost
      group.marginGenerated += margin.marginAmount

      if (margin.sourceLabel === 'Actual') {
        group.actualCostMissionCount += 1
      }

      if (isMissionActive(mission.status)) {
        group.activeMissionsCount += 1
      }

      if (mission.status === MissionStatus.Delivered) {
        group.deliveredMissionsCount += 1
      }

      if (mission.status === MissionStatus.Issue) {
        group.issueMissionsCount += 1
      }

      if (margin.isSensitive) {
        group.marginSensitiveCount += 1
      }

      if (isMissionActive(mission.status) && linkedInvoices.length === 0) {
        group.uninvoicedActiveCount += 1
      }
    })

    expenses.forEach((expense) => {
      const linkedMissionDriverKey = normalizeDriverKey(
        expense.mission_id ? missionById.get(expense.mission_id)?.driver_name : ''
      )
      const explicitDriverKey = normalizeDriverKey(expense.driver_name)
      const driverKey = linkedMissionDriverKey || explicitDriverKey

      if (!driverKey) {
        return
      }

      const group = groups.get(driverKey)

      if (!group) {
        return
      }

      group.expenses.push(expense)
      group.expensesGenerated += Number(expense.amount ?? 0)
    })

    const now = Date.now()

    const derivedAssignments = [...groups.values()]
      .map((group) => {
        const sortedMissions = [...group.missions].sort(sortMissionsForAssignment)
        const sortedExpenses = [...group.expenses].sort(
          (left, right) =>
            new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime()
        )
        const nextUpcomingMission =
          sortedMissions
            .filter(
              (mission) =>
                isMissionActive(mission.status) &&
                new Date(mission.departure_datetime).getTime() >= now
            )
            .sort(
              (left, right) =>
                new Date(left.departure_datetime).getTime() -
                new Date(right.departure_datetime).getTime()
            )[0] ?? null

        return {
          driverKey: group.driverKey,
          driverName: group.driverName,
          missions: sortedMissions,
          expenses: sortedExpenses,
          clientCount: group.clientIds.size,
          missionsCount: group.missions.length,
          activeMissionsCount: group.activeMissionsCount,
          deliveredMissionsCount: group.deliveredMissionsCount,
          issueMissionsCount: group.issueMissionsCount,
          uninvoicedActiveCount: group.uninvoicedActiveCount,
          marginSensitiveCount: group.marginSensitiveCount,
          actualCostMissionCount: group.actualCostMissionCount,
          revenueGenerated: group.revenueGenerated,
          estimatedCostGenerated: group.estimatedCostGenerated,
          actualCostGenerated: group.actualCostGenerated,
          costBasisGenerated: group.costBasisGenerated,
          costBasisLabel: getCostBasisLabel(
            group.actualCostMissionCount,
            group.missions.length
          ),
          expensesGenerated: group.expensesGenerated,
          marginGenerated: group.marginGenerated,
          marginRatio:
            group.revenueGenerated > 0 ? group.marginGenerated / group.revenueGenerated : 0,
          hasIssue: group.issueMissionsCount > 0,
          hasActiveUninvoiced: group.uninvoicedActiveCount > 0,
          hasMarginSensitive: group.marginSensitiveCount > 0,
          hasHighRevenue: false,
          mostRecentMission:
            [...group.missions].sort(
              (left, right) =>
                new Date(right.departure_datetime).getTime() -
                new Date(left.departure_datetime).getTime()
            )[0] ?? null,
          nextUpcomingMission,
        }
      })
      .sort((left, right) => {
        if (left.hasIssue && !right.hasIssue) {
          return -1
        }

        if (!left.hasIssue && right.hasIssue) {
          return 1
        }

        if (left.hasActiveUninvoiced && !right.hasActiveUninvoiced) {
          return -1
        }

        if (!left.hasActiveUninvoiced && right.hasActiveUninvoiced) {
          return 1
        }

        if (left.activeMissionsCount !== right.activeMissionsCount) {
          return right.activeMissionsCount - left.activeMissionsCount
        }

        if (left.revenueGenerated !== right.revenueGenerated) {
          return right.revenueGenerated - left.revenueGenerated
        }

        return left.driverName.localeCompare(right.driverName)
      })

    const positiveRevenueValues = derivedAssignments
      .map((assignment) => assignment.revenueGenerated)
      .filter((value) => value > 0)
      .sort((left, right) => left - right)
    const highRevenueThreshold =
      positiveRevenueValues.length > 1
        ? positiveRevenueValues[
            Math.max(0, Math.ceil(positiveRevenueValues.length * 0.75) - 1)
          ]
        : Number.POSITIVE_INFINITY

    return derivedAssignments.map((assignment) => ({
      ...assignment,
      hasHighRevenue:
        Number.isFinite(highRevenueThreshold) &&
        assignment.revenueGenerated > 0 &&
        assignment.revenueGenerated >= highRevenueThreshold,
    }))
  }, [expenses, missionById, missionInvoiceMap, missions])

  const assignmentByKey = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.driverKey, assignment] as const)),
    [assignments]
  )

  const summary = useMemo(() => {
    const totalAssignedDrivers = assignments.length
    const activeAssignments = assignments.filter(
      (assignment) => assignment.activeMissionsCount > 0
    ).length
    const totalRevenueRepresented = assignments.reduce(
      (sum, assignment) => sum + assignment.revenueGenerated,
      0
    )
    const totalCostRepresented = assignments.reduce(
      (sum, assignment) => sum + assignment.costBasisGenerated,
      0
    )
    const totalMarginRepresented = assignments.reduce(
      (sum, assignment) => sum + assignment.marginGenerated,
      0
    )
    const exposedAssignmentsCount = assignments.filter(
      (assignment) =>
        assignment.hasIssue ||
        assignment.hasActiveUninvoiced ||
        assignment.hasMarginSensitive
    ).length
    const marginSensitiveCount = assignments.filter(
      (assignment) => assignment.hasMarginSensitive
    ).length

    return {
      totalAssignedDrivers,
      activeAssignments,
      totalRevenueRepresented,
      totalCostRepresented,
      totalMarginRepresented,
      exposedAssignmentsCount,
      marginSensitiveCount,
    }
  }, [assignments])

  const queueCounts = useMemo(
    () => ({
      all: assignments.length,
      active: assignments.filter((assignment) => assignment.activeMissionsCount > 0).length,
      issues: assignments.filter((assignment) => assignment.hasIssue).length,
      uninvoiced: assignments.filter((assignment) => assignment.hasActiveUninvoiced).length,
      margin: assignments.filter((assignment) => assignment.hasMarginSensitive).length,
    }),
    [assignments]
  )

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return assignments.filter((assignment) => {
      const matchesDriver = !selectedDriverKey || assignment.driverKey === selectedDriverKey
      const matchesQueue =
        queue === 'all'
          ? true
          : queue === 'active'
            ? assignment.activeMissionsCount > 0
            : queue === 'issues'
              ? assignment.hasIssue
              : queue === 'uninvoiced'
                ? assignment.hasActiveUninvoiced
                : assignment.hasMarginSensitive

      const matchesSearch =
        !query ||
        toSearchValue(assignment.driverName).includes(query) ||
        assignment.missions.some((mission) =>
          [
            mission.reference,
            mission.departure_location,
            mission.arrival_location,
            clientNameById.get(mission.client_id),
          ]
            .filter(Boolean)
            .some((value) => toSearchValue(value).includes(query))
        )

      return matchesDriver && matchesQueue && matchesSearch
    })
  }, [assignments, clientNameById, queue, searchQuery, selectedDriverKey])

  const selectedAssignment = selectedDriverKey
    ? assignmentByKey.get(selectedDriverKey) ?? null
    : null

  const selectedLinkedInvoices = useMemo(() => {
    if (!selectedAssignment) {
      return []
    }

    const uniqueInvoices = new Map<string, Invoice>()

    selectedAssignment.missions.forEach((mission) => {
      const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
      linkedInvoices.forEach((invoice) => {
        uniqueInvoices.set(invoice.invoice_id, invoice)
      })
    })

    return [...uniqueInvoices.values()].sort((left, right) => {
      if (left.status === 'overdue' && right.status !== 'overdue') {
        return -1
      }

      if (left.status !== 'overdue' && right.status === 'overdue') {
        return 1
      }

      return new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
    })
  }, [missionInvoiceMap, selectedAssignment])

  const unassignedMissionsCount = useMemo(
    () => missions.filter((mission) => !normalizeDriverKey(mission.driver_name)).length,
    [missions]
  )

  const topRevenueAssignment = assignments[0]
    ? [...assignments]
        .sort((left, right) => right.revenueGenerated - left.revenueGenerated)[0] ?? null
    : null

  const topActiveAssignment = assignments[0]
    ? [...assignments]
        .sort((left, right) => right.activeMissionsCount - left.activeMissionsCount)[0] ?? null
    : null

  const mostExposedAssignment = assignments[0]
    ? [...assignments].sort((left, right) => {
        const leftRiskScore =
          (left.hasIssue ? 6 : 0) +
          (left.hasActiveUninvoiced ? 4 : 0) +
          left.marginSensitiveCount * 2 +
          left.activeMissionsCount
        const rightRiskScore =
          (right.hasIssue ? 6 : 0) +
          (right.hasActiveUninvoiced ? 4 : 0) +
          right.marginSensitiveCount * 2 +
          right.activeMissionsCount

        if (leftRiskScore !== rightRiskScore) {
          return rightRiskScore - leftRiskScore
        }

        return right.revenueGenerated - left.revenueGenerated
      })[0] ?? null
    : null

  const updateFilters = (updates: Record<string, string | null>) => {
    setSearchParams(mergeSearchParams(searchParams, updates), { replace: true })
  }

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const activeFilterItems = useMemo(() => {
    const items: Array<{
      id: string
      label: string
      value: string
      onClear: () => void
    }> = []

    if (queue !== 'all') {
      items.push({
        id: 'queue',
        label: 'Queue',
        value: getQueueLabel(queue),
        onClear: () => updateFilters({ queue: null }),
      })
    }

    if (selectedAssignment) {
      items.push({
        id: 'driver',
        label: 'Driver',
        value: selectedAssignment.driverName,
        onClear: () => updateFilters({ driver: null }),
      })
    }

    if (searchQuery.trim()) {
      items.push({
        id: 'q',
        label: 'Search',
        value: truncateString(searchQuery.trim(), 28),
        onClear: () => updateFilters({ q: null }),
      })
    }

    return items
  }, [queue, searchQuery, selectedAssignment, searchParams])

  return (
    <PageContainer>
      <PageHeader
        title="Assignments"
        description="Derived driver workload, revenue, cost, and margin visibility from mission assignments and linked expenses."
        actions={
          <button
            type="button"
            onClick={() =>
              navigate({
                pathname: appRoutes.missions,
                search: createSearchParams({ queue: 'active' }).toString(),
              })
            }
            className={secondaryButtonClasses}
          >
            Open active queue
          </button>
        }
      />

      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Revenue represented"
            value={formatCurrencyWithDecimals(summary.totalRevenueRepresented)}
            detail={`Across ${summary.totalAssignedDrivers} derived assignment${
              summary.totalAssignedDrivers === 1 ? '' : 's'
            }`}
            onClick={resetFilters}
          />
          <StatCard
            label="Cost basis"
            value={formatCurrencyWithDecimals(summary.totalCostRepresented)}
            detail="Mission actual cost when present, otherwise estimated"
            onClick={() => updateFilters({ queue: 'margin' })}
          />
          <StatCard
            label="Margin represented"
            value={formatCurrencyWithDecimals(summary.totalMarginRepresented)}
            detail={`${summary.marginSensitiveCount} assignment${
              summary.marginSensitiveCount === 1 ? '' : 's'
            } currently margin sensitive`}
            tone={summary.marginSensitiveCount > 0 ? 'danger' : 'success'}
            onClick={() => updateFilters({ queue: 'margin' })}
          />
          <StatCard
            label="Active assignments"
            value={String(summary.activeAssignments)}
            detail="Drivers currently carrying active operational load"
            tone={summary.activeAssignments > 0 ? 'warning' : 'default'}
            onClick={() => updateFilters({ queue: 'active' })}
          />
          <StatCard
            label="Operational exposure"
            value={String(summary.exposedAssignmentsCount)}
            detail="Issue, uninvoiced, or margin-sensitive assignments"
            tone={summary.exposedAssignmentsCount > 0 ? 'warning' : 'default'}
            onClick={() =>
              updateFilters({
                queue:
                  queueCounts.issues > 0
                    ? 'issues'
                    : queueCounts.uninvoiced > 0
                      ? 'uninvoiced'
                      : queueCounts.margin > 0
                        ? 'margin'
                        : null,
              })
            }
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
          <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <SectionCard>
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                  Filters
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Narrow the assignment surface to active workload, billing exposure, or margin
                  risk.
                </p>
              </div>

              <label className="relative mt-5 block">
                <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-500" />
                <input
                  data-ops-search="true"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => updateFilters({ q: event.target.value || null })}
                  placeholder="Search driver, mission, route, or client"
                  className="input-shell pl-11"
                />
              </label>

              <div className="mt-5 space-y-2">
                {assignmentQueueOptions.map((option) => {
                  const count =
                    option.value === 'all'
                      ? queueCounts.all
                      : option.value === 'active'
                        ? queueCounts.active
                        : option.value === 'issues'
                          ? queueCounts.issues
                          : option.value === 'uninvoiced'
                            ? queueCounts.uninvoiced
                            : queueCounts.margin

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateFilters({ queue: option.value === 'all' ? null : option.value })
                      }
                      className={clsx(
                        'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition active:scale-[0.99]',
                        queue === option.value
                          ? 'border-stone-950 bg-stone-950 text-white shadow-[0_10px_22px_rgba(28,25,23,0.16)]'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                      )}
                    >
                      <span>{option.label}</span>
                      <span>{count}</span>
                    </button>
                  )
                })}
              </div>

              {selectedAssignment ? (
                <div className="mt-5 rounded-[1.2rem] border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                    Current assignment
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {selectedAssignment.driverName}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {selectedAssignment.missionsCount} mission
                    {selectedAssignment.missionsCount === 1 ? '' : 's'} across{' '}
                    {selectedAssignment.clientCount} client
                    {selectedAssignment.clientCount === 1 ? '' : 's'}.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 rounded-[1.2rem] border border-dashed border-stone-200 bg-stone-50/70 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                  Derived view
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  Assignment analytics are derived from mission driver names and linked expense
                  records. No standalone driver record is stored in the current schema.
                </p>
              </div>

              <button type="button" onClick={resetFilters} className="btn-secondary mt-5 w-full">
                Reset filters
              </button>
            </SectionCard>
          </div>

          <div className="space-y-5">
            <ActiveFilterBar items={activeFilterItems} onClearAll={resetFilters} />

            {isLoading ? (
              <PageLoadingSkeleton stats={5} rows={4} />
            ) : error ? (
              <StatePanel
                tone="danger"
                title="Unable to load assignments"
                message={error}
                action={
                  <button
                    type="button"
                    onClick={() => {
                      void Promise.all([
                        missionsQuery.refetch(),
                        expensesQuery.refetch(),
                        invoicesQuery.refetch(),
                        clientsQuery.refetch(),
                      ])
                    }}
                    className={primaryButtonClasses}
                  >
                    Retry
                  </button>
                }
              />
            ) : assignments.length === 0 ? (
              <StatePanel
                title="No assignments yet"
                message={
                  unassignedMissionsCount > 0
                    ? `${unassignedMissionsCount} mission${
                        unassignedMissionsCount === 1 ? '' : 's'
                      } currently have no driver name. Assignments will appear once missions are assigned.`
                    : 'Assignments will appear here once missions carry a driver name.'
                }
                action={
                  <button
                    type="button"
                    onClick={() => navigate(appRoutes.missions)}
                    className={primaryButtonClasses}
                  >
                    Open missions
                  </button>
                }
              />
            ) : filteredAssignments.length === 0 ? (
              <StatePanel
                title="No matching assignments"
                message="Adjust the current search or queue to reveal another assignment."
                action={
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={secondaryButtonClasses}
                  >
                    Reset filters
                  </button>
                }
              />
            ) : (
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
                  <SectionCard className="overflow-hidden p-0">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
                      <div>
                        <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                          Assignment ranking
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                          {filteredAssignments.length} visible assignment
                          {filteredAssignments.length === 1 ? '' : 's'} ranked by revenue, cost
                          basis, margin, and current operational exposure.
                        </p>
                      </div>
                      <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
                        {getQueueLabel(queue)}
                      </div>
                    </div>

                    <div className="divide-y divide-stone-200">
                      {filteredAssignments.map((assignment) => {
                        const isSelected = assignment.driverKey === selectedDriverKey

                        return (
                          <article
                            key={assignment.driverKey}
                            role="button"
                            tabIndex={0}
                            onClick={() => updateFilters({ driver: assignment.driverKey })}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                updateFilters({ driver: assignment.driverKey })
                              }
                            }}
                            className={clsx(
                              'group grid cursor-pointer gap-4 px-5 py-4 transition hover:bg-stone-50/80 focus:outline-none focus-visible:bg-stone-50/80 md:grid-cols-[minmax(0,1.4fr)_170px_200px_180px_220px_auto] md:items-start',
                              isSelected &&
                                'bg-stone-50/90 shadow-[inset_0_0_0_1px_rgba(214,211,209,0.95)]'
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-stone-950">
                                  {assignment.driverName}
                                </h3>
                                {assignment.hasHighRevenue ? (
                                  <StatusBadge label="high revenue" tone="success" />
                                ) : null}
                                {assignment.activeMissionsCount > 0 ? (
                                  <StatusBadge label="active load" tone="info" />
                                ) : null}
                                {assignment.hasIssue ? (
                                  <StatusBadge label="issue exposure" tone="danger" />
                                ) : null}
                                {assignment.hasActiveUninvoiced ? (
                                  <StatusBadge label="uninvoiced work" tone="warning" />
                                ) : null}
                                {assignment.hasMarginSensitive ? (
                                  <StatusBadge label="margin sensitive" tone="warning" />
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm font-medium text-stone-800">
                                {assignment.missionsCount} mission
                                {assignment.missionsCount === 1 ? '' : 's'} across{' '}
                                {assignment.clientCount} client
                                {assignment.clientCount === 1 ? '' : 's'}
                              </p>
                              <p className="mt-1 text-sm text-stone-500">
                                {assignment.nextUpcomingMission
                                  ? `Next ${assignment.nextUpcomingMission.reference} · ${assignment.nextUpcomingMission.departure_location} to ${assignment.nextUpcomingMission.arrival_location}`
                                  : assignment.mostRecentMission
                                    ? `Latest ${assignment.mostRecentMission.reference} · ${assignment.mostRecentMission.departure_location} to ${assignment.mostRecentMission.arrival_location}`
                                    : 'No dated mission context yet'}
                              </p>
                            </div>

                            <div className="text-sm text-stone-500">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                Revenue
                              </p>
                              <p className="mt-1 font-medium text-stone-900">
                                {formatCurrencyWithDecimals(assignment.revenueGenerated)}
                              </p>
                              <p className="mt-1">
                                {assignment.deliveredMissionsCount} delivered mission
                                {assignment.deliveredMissionsCount === 1 ? '' : 's'}
                              </p>
                              <p className="mt-1">
                                {assignment.clientCount} client
                                {assignment.clientCount === 1 ? '' : 's'}
                              </p>
                            </div>

                            <div className="text-sm text-stone-500">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                Costs
                              </p>
                              <p className="mt-1 font-medium text-stone-900">
                                {formatCurrencyWithDecimals(assignment.costBasisGenerated)}
                              </p>
                              <p className="mt-1">{assignment.costBasisLabel}</p>
                              <p className="mt-1">
                                Expenses {formatCurrencyWithDecimals(assignment.expensesGenerated)}
                              </p>
                            </div>

                            <div className="text-sm text-stone-500">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                Margin
                              </p>
                              <p
                                className={clsx(
                                  'mt-1 font-medium',
                                  assignment.marginGenerated < 0
                                    ? 'text-rose-700'
                                    : 'text-stone-900'
                                )}
                              >
                                {formatCurrencyWithDecimals(assignment.marginGenerated)}
                              </p>
                              <p className="mt-1">
                                {formatPercentage(assignment.marginRatio * 100, 0)} margin
                              </p>
                              <p className="mt-1">
                                {assignment.marginSensitiveCount} sensitive mission
                                {assignment.marginSensitiveCount === 1 ? '' : 's'}
                              </p>
                            </div>

                            <div className="text-sm text-stone-500">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                Exposure
                              </p>
                              <p className="mt-1 font-medium text-stone-900">
                                {assignment.activeMissionsCount} active mission
                                {assignment.activeMissionsCount === 1 ? '' : 's'}
                              </p>
                              <p className="mt-1">
                                {assignment.uninvoicedActiveCount} uninvoiced in queue
                              </p>
                              <p className="mt-1">
                                {assignment.issueMissionsCount} issue mission
                                {assignment.issueMissionsCount === 1 ? '' : 's'}
                              </p>
                            </div>

                            <div className="flex items-start justify-end">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  navigate({
                                    pathname: appRoutes.missions,
                                    search: createSearchParams(
                                      assignment.hasActiveUninvoiced
                                        ? { queue: 'uninvoiced', q: assignment.driverName }
                                        : { q: assignment.driverName }
                                    ).toString(),
                                  })
                                }}
                                className={inlineButtonClasses}
                              >
                                {assignment.hasActiveUninvoiced ? 'Open uninvoiced' : 'Open missions'}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </SectionCard>

                  {selectedAssignment ? (
                    <>
                      <SectionCard>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                                {selectedAssignment.driverName}
                              </h2>
                              {selectedAssignment.hasHighRevenue ? (
                                <StatusBadge label="high revenue" tone="success" />
                              ) : null}
                              {selectedAssignment.activeMissionsCount > 0 ? (
                                <StatusBadge label="active load" tone="info" />
                              ) : null}
                              {selectedAssignment.hasIssue ? (
                                <StatusBadge label="issue exposure" tone="danger" />
                              ) : null}
                              {selectedAssignment.hasActiveUninvoiced ? (
                                <StatusBadge label="uninvoiced work" tone="warning" />
                              ) : null}
                              {selectedAssignment.hasMarginSensitive ? (
                                <StatusBadge label="margin sensitive" tone="warning" />
                              ) : null}
                            </div>
                            <p className="mt-2 max-w-3xl text-sm text-stone-600">
                              {selectedAssignment.missionsCount} mission
                              {selectedAssignment.missionsCount === 1 ? '' : 's'} across{' '}
                              {selectedAssignment.clientCount} client
                              {selectedAssignment.clientCount === 1 ? '' : 's'} with{' '}
                              {selectedAssignment.activeMissionsCount} active,{' '}
                              {selectedAssignment.issueMissionsCount} issue, and{' '}
                              {selectedAssignment.uninvoicedActiveCount} uninvoiced active mission
                              {selectedAssignment.uninvoicedActiveCount === 1 ? '' : 's'}.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate({
                                  pathname: appRoutes.missions,
                                  search: createSearchParams({
                                    q: selectedAssignment.driverName,
                                  }).toString(),
                                })
                              }
                              className={secondaryButtonClasses}
                            >
                              Open missions
                            </button>
                            {selectedAssignment.hasActiveUninvoiced ? (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate({
                                    pathname: appRoutes.missions,
                                    search: createSearchParams({
                                      queue: 'uninvoiced',
                                      q: selectedAssignment.driverName,
                                    }).toString(),
                                  })
                                }
                                className={primaryButtonClasses}
                              >
                                Review uninvoiced work
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                          <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                              Revenue
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatCurrencyWithDecimals(selectedAssignment.revenueGenerated)}
                            </p>
                          </div>
                          <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                              Cost basis
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatCurrencyWithDecimals(selectedAssignment.costBasisGenerated)}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              {selectedAssignment.costBasisLabel}
                            </p>
                          </div>
                          <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                              Actual cost
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatCurrencyWithDecimals(selectedAssignment.actualCostGenerated)}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              {selectedAssignment.actualCostMissionCount} mission
                              {selectedAssignment.actualCostMissionCount === 1 ? '' : 's'} with
                              actual cost
                            </p>
                          </div>
                          <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                              Estimated cost
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatCurrencyWithDecimals(
                                selectedAssignment.estimatedCostGenerated
                              )}
                            </p>
                          </div>
                          <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                              Margin
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatCurrencyWithDecimals(selectedAssignment.marginGenerated)}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              {formatPercentage(selectedAssignment.marginRatio * 100, 0)} margin
                            </p>
                          </div>
                          <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                              Expenses
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatCurrencyWithDecimals(selectedAssignment.expensesGenerated)}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              {selectedAssignment.expenses.length} linked expense
                              {selectedAssignment.expenses.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                      </SectionCard>

                      <SectionCard className="overflow-hidden p-0">
                        <div className="border-b border-stone-200 px-5 py-4">
                          <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                            Linked missions
                          </h2>
                          <p className="mt-1 text-sm text-stone-500">
                            {selectedAssignment.missionsCount} mission
                            {selectedAssignment.missionsCount === 1 ? '' : 's'} carrying{' '}
                            {formatCurrencyWithDecimals(selectedAssignment.revenueGenerated)} in
                            revenue for this assignment.
                          </p>
                        </div>

                        <div className="divide-y divide-stone-200">
                          {selectedAssignment.missions.map((mission) => {
                            const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
                            const margin = getMissionMarginSnapshot(mission)

                            return (
                              <div
                                key={mission.mission_id}
                                className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.15fr)_170px_180px_auto] md:items-start"
                              >
                                <button
                                  type="button"
                                  onClick={() => navigate(getMissionDetailRoute(mission.mission_id))}
                                  className="min-w-0 rounded-[1rem] px-1 py-1 text-left transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-stone-950">
                                      {mission.reference}
                                    </p>
                                    <StatusBadge
                                      label={missionStatusLabels[mission.status]}
                                      tone={missionTone(mission.status)}
                                    />
                                    {linkedInvoices.length === 0 ? (
                                      <StatusBadge label="not invoiced" tone="warning" />
                                    ) : null}
                                    {margin.isSensitive ? (
                                      <StatusBadge label="margin sensitive" tone="warning" />
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-sm text-stone-700">
                                    {mission.departure_location} to {mission.arrival_location}
                                  </p>
                                  <p className="mt-1 text-sm text-stone-500">
                                    {clientNameById.get(mission.client_id) ?? 'Unknown client'}
                                  </p>
                                </button>

                                <div className="text-sm text-stone-500">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                    Schedule
                                  </p>
                                  <p className="mt-1 font-medium text-stone-900">
                                    {formatDateTime(mission.departure_datetime)}
                                  </p>
                                  <p className="mt-1">
                                    {mission.arrival_datetime
                                      ? formatDateTime(mission.arrival_datetime)
                                      : 'Arrival not set'}
                                  </p>
                                </div>

                                <div className="text-sm text-stone-500">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                    Finance
                                  </p>
                                  <p className="mt-1 font-medium text-stone-900">
                                    {formatCurrencyWithDecimals(mission.revenue_amount)}
                                  </p>
                                  <p className="mt-1">
                                    Margin {formatPercentage(margin.marginRatio * 100, 0)}
                                  </p>
                                  <p className="mt-1">
                                    {margin.sourceLabel} cost{' '}
                                    {formatCurrencyWithDecimals(margin.baselineCost)}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-start justify-end gap-2">
                                  {linkedInvoices.length > 0 ? (
                                    linkedInvoices.map((invoice) => (
                                      <button
                                        key={invoice.invoice_id}
                                        type="button"
                                        onClick={() =>
                                          navigate(getInvoiceDetailRoute(invoice.invoice_id))
                                        }
                                        className={inlineButtonClasses}
                                      >
                                        View {invoice.invoice_number}
                                      </button>
                                    ))
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate({
                                          pathname: appRoutes.invoices,
                                          search: createSearchParams({
                                            mission: mission.mission_id,
                                            compose: 'new',
                                          }).toString(),
                                        })
                                      }
                                      className={inlineButtonClasses}
                                    >
                                      Create invoice
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </SectionCard>

                      <SectionCard className="overflow-hidden p-0">
                        <div className="border-b border-stone-200 px-5 py-4">
                          <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                            Linked invoices
                          </h2>
                          <p className="mt-1 text-sm text-stone-500">
                            {selectedLinkedInvoices.length} linked invoice
                            {selectedLinkedInvoices.length === 1 ? '' : 's'} supporting cash
                            visibility for this assignment.
                          </p>
                        </div>

                        {selectedLinkedInvoices.length === 0 ? (
                          <div className="px-5 py-6 text-sm text-stone-500">
                            No invoices are linked yet. Uninvoiced missions above can open
                            invoicing directly.
                          </div>
                        ) : (
                          <div className="divide-y divide-stone-200">
                            {selectedLinkedInvoices.map((invoice) => (
                              <button
                                key={invoice.invoice_id}
                                type="button"
                                onClick={() => navigate(getInvoiceDetailRoute(invoice.invoice_id))}
                                className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-stone-50 md:grid-cols-[minmax(0,1fr)_170px_170px_auto] md:items-start"
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-stone-950">
                                      {invoice.invoice_number}
                                    </p>
                                    <StatusBadge
                                      label={invoiceStatusLabels[invoice.status]}
                                      tone={invoiceTone(invoice.status)}
                                    />
                                  </div>
                                  <p className="mt-1 text-sm text-stone-500">
                                    {clientNameById.get(invoice.client_id) ?? 'Unknown client'}
                                  </p>
                                </div>

                                <div className="text-sm text-stone-500">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                    Due
                                  </p>
                                  <p className="mt-1 font-medium text-stone-900">
                                    {formatDate(invoice.due_date)}
                                  </p>
                                  <p className="mt-1">
                                    Issued {formatDate(invoice.issue_date)}
                                  </p>
                                </div>

                                <div className="text-sm text-stone-500">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                    Cash
                                  </p>
                                  <p className="mt-1 font-medium text-stone-900">
                                    {formatCurrencyWithDecimals(invoice.amount_total)}
                                  </p>
                                  <p className="mt-1">
                                    Outstanding{' '}
                                    {formatCurrencyWithDecimals(getInvoiceBalance(invoice))}
                                  </p>
                                </div>

                                <div className="flex justify-end">
                                  <span className={tertiaryButtonClasses}>Open invoice</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </SectionCard>

                      <SectionCard className="overflow-hidden p-0">
                        <div className="border-b border-stone-200 px-5 py-4">
                          <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                            Linked expenses
                          </h2>
                          <p className="mt-1 text-sm text-stone-500">
                            {selectedAssignment.expenses.length} linked expense
                            {selectedAssignment.expenses.length === 1 ? '' : 's'} safely
                            attributed through driver name or mission linkage.
                          </p>
                        </div>

                        {selectedAssignment.expenses.length === 0 ? (
                          <div className="px-5 py-6 text-sm text-stone-500">
                            No linked expenses are currently attributed to this assignment.
                          </div>
                        ) : (
                          <div className="divide-y divide-stone-200">
                            {selectedAssignment.expenses.map((expense) => {
                              const linkedMission = expense.mission_id
                                ? missionById.get(expense.mission_id) ?? null
                                : null

                              return (
                                <div
                                  key={expense.expense_id}
                                  className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_140px_180px_auto] md:items-start"
                                >
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-semibold text-stone-950">
                                        {expenseTypeLabels[expense.expense_type]}
                                      </p>
                                      <StatusBadge
                                        label={approvalStatusLabels[expense.approval_status]}
                                        tone={approvalTone(expense.approval_status)}
                                      />
                                      {!expense.receipt_present ? (
                                        <StatusBadge label="no receipt" tone="warning" />
                                      ) : null}
                                    </div>
                                    <p className="mt-1 text-sm text-stone-500">
                                      {linkedMission
                                        ? `${linkedMission.reference} · ${linkedMission.departure_location} to ${linkedMission.arrival_location}`
                                        : expense.advanced_by_driver
                                          ? 'Advanced by driver'
                                          : 'Paid by company'}
                                    </p>
                                    {expense.notes ? (
                                      <p className="mt-1 text-sm text-stone-500">
                                        {truncateString(expense.notes, 120)}
                                      </p>
                                    ) : null}
                                  </div>

                                  <div className="text-sm text-stone-500">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                      Amount
                                    </p>
                                    <p className="mt-1 font-medium text-stone-900">
                                      {formatCurrencyWithDecimals(expense.amount)}
                                    </p>
                                  </div>

                                  <div className="text-sm text-stone-500">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                      Date
                                    </p>
                                    <p className="mt-1 font-medium text-stone-900">
                                      {formatDate(expense.expense_date)}
                                    </p>
                                  </div>

                                  <div className="flex justify-end">
                                    <span className={tertiaryButtonClasses}>
                                      {expense.advanced_by_driver
                                        ? 'Driver advanced'
                                        : 'Company paid'}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </SectionCard>
                    </>
                  ) : null}
                </div>

                <div className="space-y-5 2xl:sticky 2xl:top-24 2xl:self-start">
                  <SectionCard>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                      Top revenue driver
                    </p>
                    {topRevenueAssignment ? (
                      <>
                        <p className="mt-3 text-lg font-semibold text-stone-950">
                          {topRevenueAssignment.driverName}
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          {formatCurrencyWithDecimals(topRevenueAssignment.revenueGenerated)} across{' '}
                          {topRevenueAssignment.missionsCount} mission
                          {topRevenueAssignment.missionsCount === 1 ? '' : 's'}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateFilters({ driver: topRevenueAssignment.driverKey })}
                          className={inlineButtonClasses + ' mt-4'}
                        >
                          View assignment
                        </button>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-stone-500">
                        Revenue will appear once assignments are recorded.
                      </p>
                    )}
                  </SectionCard>

                  <SectionCard>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                      Top active workload
                    </p>
                    {topActiveAssignment ? (
                      <>
                        <p className="mt-3 text-lg font-semibold text-stone-950">
                          {topActiveAssignment.driverName}
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          {topActiveAssignment.activeMissionsCount} active mission
                          {topActiveAssignment.activeMissionsCount === 1 ? '' : 's'} in queue
                        </p>
                        <button
                          type="button"
                          onClick={() => updateFilters({ driver: topActiveAssignment.driverKey })}
                          className={inlineButtonClasses + ' mt-4'}
                        >
                          View assignment
                        </button>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-stone-500">
                        No active mission load is visible right now.
                      </p>
                    )}
                  </SectionCard>

                  <SectionCard>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                      Most exposed assignment
                    </p>
                    {mostExposedAssignment ? (
                      <>
                        <p className="mt-3 text-lg font-semibold text-stone-950">
                          {mostExposedAssignment.driverName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {mostExposedAssignment.hasIssue ? (
                            <StatusBadge label="issue" tone="danger" />
                          ) : null}
                          {mostExposedAssignment.hasActiveUninvoiced ? (
                            <StatusBadge label="uninvoiced work" tone="warning" />
                          ) : null}
                          {mostExposedAssignment.hasMarginSensitive ? (
                            <StatusBadge label="margin sensitive" tone="warning" />
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateFilters({ driver: mostExposedAssignment.driverKey })
                          }
                          className={inlineButtonClasses + ' mt-4'}
                        >
                          Review exposure
                        </button>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-stone-500">
                        Exposure signals will appear once assignments are active.
                      </p>
                    )}
                  </SectionCard>

                  <SectionCard>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                      Unassigned missions
                    </p>
                    <p className="mt-3 text-lg font-semibold text-stone-950">
                      {unassignedMissionsCount}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      Missions without a driver name are excluded from the ranking until assigned.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(appRoutes.missions)}
                      className={inlineButtonClasses + ' mt-4'}
                    >
                      Open missions
                    </button>
                  </SectionCard>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
