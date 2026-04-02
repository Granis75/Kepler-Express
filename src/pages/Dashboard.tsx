import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import {
  PageLoadingSkeleton,
  SectionCard,
  StatCard,
  StatePanel,
  StatusBadge,
} from '../components/WorkspaceUi'
import { useExpenses } from '../hooks/useExpenses'
import { useInvoices } from '../hooks/useInvoices'
import { useMissions } from '../hooks/useMissions'
import { appRoutes } from '../lib/routes'
import { formatCurrencyWithDecimals, formatDate, formatDateTime } from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'

function toSafeNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

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

  const metrics = useMemo(() => {
    const totalRevenue = missions.reduce(
      (sum, mission) => sum + toSafeNumber(mission.revenue_amount),
      0
    )
    const estimatedCost = missions.reduce(
      (sum, mission) => sum + toSafeNumber(mission.estimated_cost_amount),
      0
    )
    const actualCost = missions.reduce(
      (sum, mission) => sum + toSafeNumber(mission.actual_cost_amount),
      0
    )
    const unpaidCash = invoices.reduce(
      (sum, invoice) =>
        sum + Math.max(0, toSafeNumber(invoice.amount_total) - toSafeNumber(invoice.amount_paid)),
      0
    )
    const overdueCount = invoices.filter((invoice) => invoice.status === 'overdue').length
    const pendingExpenses = expenses.filter(
      (expense) => expense.approval_status === 'pending'
    ).length

    return {
      totalRevenue,
      estimatedCost,
      actualCost,
      margin: totalRevenue - actualCost,
      unpaidCash,
      overdueCount,
      pendingExpenses,
    }
  }, [expenses, invoices, missions])

  const activeMissions = [...missions]
    .filter((mission) => ['planned', 'assigned', 'in_progress'].includes(mission.status))
    .sort(
      (left, right) =>
        new Date(left.departure_datetime).getTime() - new Date(right.departure_datetime).getTime()
    )
    .slice(0, 5)

  const unpaidInvoices = [...invoices]
    .filter((invoice) => Math.max(0, invoice.amount_total - invoice.amount_paid) > 0)
    .sort((left, right) => {
      if (left.status === 'overdue' && right.status !== 'overdue') {
        return -1
      }

      if (left.status !== 'overdue' && right.status === 'overdue') {
        return 1
      }

      return right.invoice_number.localeCompare(left.invoice_number)
    })
    .slice(0, 5)

  const recentActivity = useMemo(() => {
    const missionActivity = missions.map((mission) => ({
      id: `mission-${mission.mission_id}`,
      title: mission.reference,
      subtitle: `${mission.departure_location} to ${mission.arrival_location}`,
      timestamp: mission.updated_at || mission.created_at || mission.departure_datetime,
      label: 'Mission',
    }))

    const invoiceActivity = invoices.map((invoice) => ({
      id: `invoice-${invoice.invoice_id}`,
      title: invoice.invoice_number,
      subtitle: `${formatCurrencyWithDecimals(invoice.amount_total)} total`,
      timestamp: invoice.updated_at || invoice.created_at || invoice.issue_date,
      label: 'Invoice',
    }))

    const expenseActivity = expenses.map((expense) => ({
      id: `expense-${expense.expense_id}`,
      title: `${expense.expense_type} expense`,
      subtitle: `${formatCurrencyWithDecimals(expense.amount)} • ${expense.driver_name || 'No driver'}`,
      timestamp: expense.updated_at || expense.created_at || expense.expense_date,
      label: 'Expense',
    }))

    return [...missionActivity, ...invoiceActivity, ...expenseActivity]
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      )
      .slice(0, 6)
  }, [expenses, invoices, missions])

  const controlSummary = [
    {
      label: 'Active missions',
      value: String(activeMissions.length),
      note: 'Routes currently in motion or about to start',
    },
    {
      label: 'Overdue invoices',
      value: String(metrics.overdueCount),
      note: 'Cash items needing follow-up',
    },
    {
      label: 'Pending expenses',
      value: String(metrics.pendingExpenses),
      note: 'Approvals still waiting on review',
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`A focused view of ${organization?.name ?? 'your workspace'} across operations, cash collection, and expense control.`}
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate(appRoutes.missions)}
              className="btn-secondary"
            >
              Review missions
            </button>
            <button
              type="button"
              onClick={() => navigate(appRoutes.invoices)}
              className="btn-primary"
            >
              Open invoices
            </button>
          </>
        }
      />

      {isLoading ? (
        <PageLoadingSkeleton stats={6} rows={4} />
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
          message="Create clients, missions, and invoices to populate the dashboard with live operational context."
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
        <div className="space-y-6">
          <SectionCard className="overflow-hidden bg-[linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(247,243,236,0.92))]">
            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
              <div>
                <span className="eyebrow-chip">Control panel</span>
                <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-stone-950">
                  Daily operational picture
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                  Revenue, margin, cash collection, and approvals stay visible in one
                  place so the team can act without switching between modules.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {controlSummary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.35rem] border border-stone-200 bg-white/82 px-4 py-4 shadow-sm"
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                      {item.label}
                    </p>
                    <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-stone-950">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-stone-500">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Revenue"
              value={formatCurrencyWithDecimals(metrics.totalRevenue)}
              detail="Total mission revenue in the workspace"
            />
            <StatCard
              label="Gross margin"
              value={formatCurrencyWithDecimals(metrics.margin)}
              detail={`${formatCurrencyWithDecimals(metrics.actualCost)} actual cost`}
              tone={metrics.margin >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              label="Unpaid cash"
              value={formatCurrencyWithDecimals(metrics.unpaidCash)}
              detail={`${metrics.overdueCount} overdue invoice${metrics.overdueCount > 1 ? 's' : ''}`}
              tone={metrics.overdueCount > 0 ? 'danger' : 'warning'}
            />
            <StatCard
              label="Estimated cost"
              value={formatCurrencyWithDecimals(metrics.estimatedCost)}
              detail="Forward view based on mission planning"
            />
            <StatCard
              label="Actual cost"
              value={formatCurrencyWithDecimals(metrics.actualCost)}
              detail="Costs synced from expenses"
            />
            <StatCard
              label="Pending expense approvals"
              value={String(metrics.pendingExpenses)}
              detail="Expenses awaiting validation"
              tone={metrics.pendingExpenses > 0 ? 'warning' : 'default'}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionCard>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Active missions
                  </h2>
                  <p className="text-sm text-stone-500">
                    Planned, assigned, or in-progress work requiring attention.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(appRoutes.missions)}
                  className="btn-secondary px-4 py-2"
                >
                  View all
                </button>
              </div>

              <div className="space-y-3">
                {activeMissions.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-sm text-stone-500">
                    No active missions right now.
                  </div>
                ) : (
                  activeMissions.map((mission) => (
                    <div
                      key={mission.mission_id}
                      className="flex flex-col gap-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/92 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-stone-950">{mission.reference}</p>
                          <StatusBadge
                            label={mission.status.replace('_', ' ')}
                            tone={getMissionTone(mission.status)}
                          />
                        </div>
                        <p className="mt-2 text-sm text-stone-600">
                          {mission.departure_location} to {mission.arrival_location}
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          {formatDateTime(mission.departure_datetime)}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] border border-stone-200 bg-white/88 px-4 py-3 text-left lg:min-w-[180px] lg:text-right">
                        <p className="text-sm font-semibold text-stone-950">
                          {formatCurrencyWithDecimals(mission.revenue_amount)}
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          {mission.driver_name || 'Driver unassigned'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <div className="space-y-6">
              <SectionCard>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                      Unpaid invoices
                    </h2>
                    <p className="text-sm text-stone-500">
                      Immediate collection priorities across billing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(appRoutes.invoices)}
                    className="btn-secondary px-4 py-2"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-3">
                  {unpaidInvoices.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-sm text-stone-500">
                      No unpaid invoices right now.
                    </div>
                  ) : (
                    unpaidInvoices.map((invoice) => (
                      <div
                        key={invoice.invoice_id}
                        className="rounded-[1.5rem] border border-stone-200 bg-stone-50/92 px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-stone-950">
                            {invoice.invoice_number}
                          </p>
                          <StatusBadge label={invoice.status} tone={getInvoiceTone(invoice.status)} />
                        </div>
                        <p className="mt-2 text-sm text-stone-500">
                          Due {formatDate(invoice.due_date)}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-[1rem] border border-stone-200 bg-white/86 px-3 py-2.5">
                          <span className="text-xs uppercase tracking-[0.18em] text-stone-500">
                            Outstanding
                          </span>
                          <span className="text-sm font-semibold text-stone-900">
                            {formatCurrencyWithDecimals(
                              Math.max(0, invoice.amount_total - invoice.amount_paid)
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard>
                <div className="mb-4">
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Recent activity
                  </h2>
                  <p className="text-sm text-stone-500">
                    A compact stream of the latest mission, expense, and invoice changes.
                  </p>
                </div>

                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/92 px-4 py-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-stone-950">{item.title}</p>
                          <StatusBadge label={item.label} />
                        </div>
                        <p className="mt-1 text-sm text-stone-500">{item.subtitle}</p>
                      </div>
                      <div className="rounded-[1rem] border border-stone-200 bg-white/88 px-3 py-2 text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Updated</p>
                        <p className="mt-1 text-sm text-stone-700">{formatDateTime(item.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
