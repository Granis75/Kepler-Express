import { useMemo } from 'react'
import { createSearchParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import {
  ActionItem,
  ActionPanel,
  PageLoadingSkeleton,
  SectionCard,
  StatCard,
  StatePanel,
  StatusBadge,
} from '../components/WorkspaceUi'
import { useExpenses } from '../hooks/useExpenses'
import { useInvoices } from '../hooks/useInvoices'
import { useMissions } from '../hooks/useMissions'
import {
  getInvoiceBalance,
  getMissionInvoiceMap,
  getMissionMarginSnapshot,
  isInvoiceInCollectionQueue,
  isMissionActive,
} from '../lib/operations'
import { appRoutes } from '../lib/routes'
import {
  formatCurrencyWithDecimals,
  formatDate,
  formatDateTime,
  formatPercentage,
} from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'

function getMissionTone(status: string) {
  switch (status) {
    case 'delivered':
      return 'success' as const
    case 'in_progress':
      return 'info' as const
    case 'issue':
      return 'danger' as const
    case 'assigned':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function getInvoiceTone(status: string) {
  switch (status) {
    case 'paid':
      return 'success' as const
    case 'partial':
      return 'warning' as const
    case 'overdue':
      return 'danger' as const
    case 'sent':
      return 'info' as const
    default:
      return 'neutral' as const
  }
}

function getExpenseTone(expense: { approval_status: string; receipt_present: boolean }) {
  if (expense.approval_status === 'pending') {
    return 'warning' as const
  }

  if (!expense.receipt_present) {
    return 'danger' as const
  }

  if (expense.approval_status === 'paid') {
    return 'success' as const
  }

  return 'neutral' as const
}

export function Dashboard() {
  const navigate = useNavigate()
  const { organization } = useWorkspaceState()
  const missionsQuery = useMissions()
  const invoicesQuery = useInvoices()
  const expensesQuery = useExpenses()

  const missions = missionsQuery.data ?? []
  const invoices = invoicesQuery.data ?? []
  const expenses = expensesQuery.data ?? []
  const isLoading =
    missionsQuery.isLoading || invoicesQuery.isLoading || expensesQuery.isLoading
  const error =
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    (invoicesQuery.error instanceof Error && invoicesQuery.error.message) ||
    (expensesQuery.error instanceof Error && expensesQuery.error.message) ||
    null

  const missionInvoiceMap = useMemo(() => getMissionInvoiceMap(invoices), [invoices])

  const missionReferenceById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission.reference] as const)),
    [missions]
  )

  const activeMissions = useMemo(
    () =>
      [...missions]
        .filter((mission) => isMissionActive(mission.status))
        .sort(
          (left, right) =>
            new Date(left.departure_datetime).getTime() -
            new Date(right.departure_datetime).getTime()
        ),
    [missions]
  )

  const collectionQueue = useMemo(
    () =>
      [...invoices]
        .filter((invoice) => isInvoiceInCollectionQueue(invoice))
        .sort((left, right) => {
          if (left.status === 'overdue' && right.status !== 'overdue') {
            return -1
          }

          if (left.status !== 'overdue' && right.status === 'overdue') {
            return 1
          }

          return new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
        }),
    [invoices]
  )

  const expenseAttention = useMemo(
    () =>
      [...expenses]
        .filter((expense) => expense.approval_status === 'pending' || !expense.receipt_present)
        .sort(
          (left, right) =>
            new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime()
        ),
    [expenses]
  )

  const metrics = useMemo(() => {
    const unpaidCash = collectionQueue.reduce(
      (sum, invoice) => sum + getInvoiceBalance(invoice),
      0
    )
    const overdueCount = invoices.filter((invoice) => invoice.status === 'overdue').length
    const pendingExpenses = expenses.filter(
      (expense) => expense.approval_status === 'pending'
    ).length
    const activeWithoutInvoice = activeMissions.filter(
      (mission) => (missionInvoiceMap.get(mission.mission_id) ?? []).length === 0
    ).length
    const marginSensitive = activeMissions.filter((mission) =>
      getMissionMarginSnapshot(mission).isSensitive
    ).length
    const missingReceipts = expenses.filter((expense) => !expense.receipt_present).length

    return {
      unpaidCash,
      overdueCount,
      pendingExpenses,
      activeMissionCount: activeMissions.length,
      activeWithoutInvoice,
      marginSensitive,
      missingReceipts,
    }
  }, [activeMissions, collectionQueue, expenses, invoices, missionInvoiceMap])

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Operational control for ${organization?.name ?? 'your workspace'}, with billing, mission execution, and expense exceptions surfaced as working queues.`}
        actions={
          <>
            <button
              type="button"
              onClick={() =>
                navigate({
                  pathname: appRoutes.missions,
                  search: createSearchParams({ queue: 'active' }).toString(),
                })
              }
              className="btn-secondary"
            >
              Active missions
            </button>
            <button
              type="button"
              onClick={() =>
                navigate({
                  pathname: appRoutes.invoices,
                  search: createSearchParams({ queue: 'unpaid' }).toString(),
                })
              }
              className="btn-primary"
            >
              Collection queue
            </button>
          </>
        }
      />

      {isLoading ? (
        <PageLoadingSkeleton stats={4} rows={4} />
      ) : error ? (
        <StatePanel
          tone="danger"
          title="Dashboard unavailable"
          message={error}
          action={
            <button
              type="button"
              onClick={() => {
                void Promise.all([
                  missionsQuery.refetch(),
                  invoicesQuery.refetch(),
                  expensesQuery.refetch(),
                ])
              }}
              className="btn-primary"
            >
              Retry
            </button>
          }
        />
      ) : missions.length === 0 && invoices.length === 0 && expenses.length === 0 ? (
        <StatePanel
          title="Your workspace is ready for first data"
          message="Create clients, missions, invoices, and expenses to turn this dashboard into a live operating console."
          action={
            <button
              type="button"
              onClick={() => navigate(appRoutes.clients)}
              className="btn-primary"
            >
              Open clients
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Unpaid cash"
              value={formatCurrencyWithDecimals(metrics.unpaidCash)}
              detail={`${collectionQueue.length} invoice${collectionQueue.length === 1 ? '' : 's'} in collection`}
              tone={metrics.overdueCount > 0 ? 'danger' : 'warning'}
              onClick={() =>
                navigate({
                  pathname: appRoutes.invoices,
                  search: createSearchParams({ queue: 'unpaid' }).toString(),
                })
              }
            />
            <StatCard
              label="Pending expense approvals"
              value={String(metrics.pendingExpenses)}
              detail="Waiting on ops or finance review"
              tone={metrics.pendingExpenses > 0 ? 'warning' : 'default'}
              onClick={() =>
                navigate({
                  pathname: appRoutes.expenses,
                  search: createSearchParams({ queue: 'pending' }).toString(),
                })
              }
            />
            <StatCard
              label="Active missions"
              value={String(metrics.activeMissionCount)}
              detail={`${metrics.activeWithoutInvoice} without invoice linkage`}
              tone={metrics.activeWithoutInvoice > 0 ? 'warning' : 'default'}
              onClick={() =>
                navigate({
                  pathname: appRoutes.missions,
                  search: createSearchParams({ queue: 'active' }).toString(),
                })
              }
            />
            <StatCard
              label="Overdue invoices"
              value={String(metrics.overdueCount)}
              detail="Past due and needing follow-up"
              tone={metrics.overdueCount > 0 ? 'danger' : 'default'}
              onClick={() =>
                navigate({
                  pathname: appRoutes.invoices,
                  search: createSearchParams({ queue: 'overdue' }).toString(),
                })
              }
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <ActionPanel>
              <div className="px-5 py-4">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                  Action queue
                </h2>
              </div>
              <ActionItem
                count={metrics.activeWithoutInvoice}
                tone={metrics.activeWithoutInvoice > 0 ? 'warning' : 'neutral'}
                title={`${metrics.activeWithoutInvoice} mission${metrics.activeWithoutInvoice === 1 ? '' : 's'} need${metrics.activeWithoutInvoice === 1 ? 's' : ''} invoicing`}
                actionLabel="Create invoice"
                onClick={() =>
                  navigate({
                    pathname: appRoutes.missions,
                    search: createSearchParams({ queue: 'uninvoiced' }).toString(),
                  })
                }
              />
              <ActionItem
                count={metrics.overdueCount}
                tone={metrics.overdueCount > 0 ? 'danger' : 'neutral'}
                title={`${metrics.overdueCount} overdue invoice${metrics.overdueCount === 1 ? '' : 's'}`}
                actionLabel="Review invoices"
                onClick={() =>
                  navigate({
                    pathname: appRoutes.invoices,
                    search: createSearchParams({ queue: 'overdue' }).toString(),
                  })
                }
              />
              <ActionItem
                count={metrics.pendingExpenses}
                tone={metrics.pendingExpenses > 0 ? 'warning' : 'neutral'}
                title={`${metrics.pendingExpenses} expense${metrics.pendingExpenses === 1 ? '' : 's'} pending`}
                actionLabel="Review expenses"
                onClick={() =>
                  navigate({
                    pathname: appRoutes.expenses,
                    search: createSearchParams({ queue: 'pending' }).toString(),
                  })
                }
              />
            </ActionPanel>

            <SectionCard className="p-0">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Expense control
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Pending approvals and missing receipts across the latest expense activity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      pathname: appRoutes.expenses,
                      search: createSearchParams({ queue: 'pending' }).toString(),
                    })
                  }
                  className="btn-secondary px-4 py-2"
                >
                  Review expenses
                </button>
              </div>

              {expenseAttention.length === 0 ? (
                <div className="px-5 py-8 text-sm text-stone-500">
                  Expense approvals and receipt control are clear.
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {expenseAttention.slice(0, 5).map((expense) => (
                    <button
                      key={expense.expense_id}
                      type="button"
                      onClick={() =>
                        navigate({
                          pathname: appRoutes.expenses,
                          search: createSearchParams({ focus: expense.expense_id }).toString(),
                        })
                      }
                      className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-stone-100 md:grid-cols-[minmax(0,1fr)_160px_140px]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-stone-950">
                            {expense.expense_type}
                          </p>
                          <StatusBadge
                            label={expense.approval_status}
                            tone={getExpenseTone(expense)}
                          />
                          {!expense.receipt_present ? (
                            <StatusBadge label="receipt missing" tone="danger" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-stone-500">
                          {missionReferenceById.get(expense.mission_id ?? '') || 'No linked mission'}
                        </p>
                      </div>
                      <div className="text-sm text-stone-500">
                        <p className="font-medium text-stone-900">
                          {formatCurrencyWithDecimals(expense.amount)}
                        </p>
                        <p className="mt-1">{formatDate(expense.expense_date)}</p>
                      </div>
                      <div className="text-sm text-stone-500">
                        <p className="font-medium text-stone-900">
                          {expense.driver_name || 'No driver'}
                        </p>
                        <p className="mt-1">
                          {expense.advanced_by_driver ? 'Driver advance' : 'Company paid'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard className="p-0">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Active mission queue
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Live missions with invoice visibility and margin context.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      pathname: appRoutes.missions,
                      search: createSearchParams({ queue: 'active' }).toString(),
                    })
                  }
                  className="btn-secondary px-4 py-2"
                >
                  Open missions
                </button>
              </div>

              {activeMissions.length === 0 ? (
                <div className="px-5 py-8 text-sm text-stone-500">
                  No active missions right now.
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {activeMissions.slice(0, 6).map((mission) => {
                    const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
                    const margin = getMissionMarginSnapshot(mission)

                    return (
                      <button
                        key={mission.mission_id}
                        type="button"
                        onClick={() =>
                          navigate({
                            pathname: appRoutes.missions,
                            search: createSearchParams({ focus: mission.mission_id }).toString(),
                          })
                        }
                        className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-stone-100 md:grid-cols-[minmax(0,1.1fr)_160px_180px]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-stone-950">{mission.reference}</p>
                            <StatusBadge
                              label={mission.status.replace('_', ' ')}
                              tone={getMissionTone(mission.status)}
                            />
                            {linkedInvoices.length === 0 ? (
                              <StatusBadge label="not invoiced" tone="warning" />
                            ) : null}
                            {margin.isSensitive ? (
                              <StatusBadge label="margin sensitive" tone="warning" />
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-stone-500">
                            {mission.departure_location} to {mission.arrival_location}
                          </p>
                          <p className="mt-1 text-sm text-stone-500">
                            {linkedInvoices.length > 0
                              ? `Invoice ${linkedInvoices.map((invoice) => invoice.invoice_number).join(', ')}`
                              : 'Billing not linked yet'}
                          </p>
                        </div>
                        <div className="text-sm text-stone-500">
                          <p className="font-medium text-stone-900">
                            {formatDateTime(mission.departure_datetime)}
                          </p>
                          <p className="mt-1">{mission.driver_name || 'Driver unassigned'}</p>
                        </div>
                        <div className="text-sm text-stone-500">
                          <p className="font-medium text-stone-900">
                            {formatCurrencyWithDecimals(mission.revenue_amount)}
                          </p>
                          <p className="mt-1">
                            Margin {formatPercentage(margin.marginRatio * 100, 0)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard className="p-0">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Collection queue
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Invoices still open, ordered for collection follow-up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      pathname: appRoutes.invoices,
                      search: createSearchParams({ queue: 'unpaid' }).toString(),
                    })
                  }
                  className="btn-secondary px-4 py-2"
                >
                  Open invoices
                </button>
              </div>

              {collectionQueue.length === 0 ? (
                <div className="px-5 py-8 text-sm text-stone-500">
                  No invoices are waiting for collection.
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {collectionQueue.slice(0, 6).map((invoice) => (
                    <button
                      key={invoice.invoice_id}
                      type="button"
                      onClick={() =>
                        navigate({
                          pathname: appRoutes.invoices,
                          search: createSearchParams({ focus: invoice.invoice_id }).toString(),
                        })
                      }
                      className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-stone-100 md:grid-cols-[minmax(0,1fr)_160px_180px]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-stone-950">
                            {invoice.invoice_number}
                          </p>
                          <StatusBadge label={invoice.status} tone={getInvoiceTone(invoice.status)} />
                        </div>
                        <p className="mt-1 text-sm text-stone-500">
                          {invoice.mission_ids.length > 0
                            ? invoice.mission_ids
                                .map((missionId) => missionReferenceById.get(missionId))
                                .filter(Boolean)
                                .join(', ')
                            : 'No linked missions'}
                        </p>
                      </div>
                      <div className="text-sm text-stone-500">
                        <p className="font-medium text-stone-900">
                          Due {formatDate(invoice.due_date)}
                        </p>
                        <p className="mt-1">
                          {formatCurrencyWithDecimals(invoice.amount_total)} total
                        </p>
                      </div>
                      <div className="text-sm text-stone-500">
                        <p className="font-medium text-stone-900">
                          {formatCurrencyWithDecimals(getInvoiceBalance(invoice))}
                        </p>
                        <p className="mt-1">Outstanding</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
