import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { useAuthState } from '../lib/auth'
import { useExpenses } from '../hooks/useExpenses'
import { useMissions } from '../hooks/useMissions'
import { useInvoices } from '../hooks/useInvoices'

const numberFormatter = new Intl.NumberFormat('fr-FR')

function toSafeNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function formatEuro(value: number) {
  return `${numberFormatter.format(value)} €`
}

export function Dashboard() {
  const { authReady, user } = useAuthState()
  const canLoadMissions = authReady && Boolean(user)
  const {
    data: missions = [],
    isLoading,
    error,
    refetch,
  } = useMissions(canLoadMissions)
  const { data: invoices = [], error: invoicesError } = useInvoices(canLoadMissions)
  const { data: expenses = [], error: expensesError } = useExpenses(canLoadMissions)

  const totalRevenue = missions.reduce(
    (sum, mission) => sum + toSafeNumber(mission.revenue_amount),
    0
  )
  const totalEstimatedCost = missions.reduce(
    (sum, mission) => sum + toSafeNumber(mission.estimated_cost_amount),
    0
  )
  const totalActualCost = missions.reduce(
    (sum, mission) => sum + toSafeNumber(mission.actual_cost_amount),
    0
  )
  const totalMargin = totalRevenue - totalActualCost
  const unpaidAmount =
    invoicesError instanceof Error
      ? 0
      : invoices.reduce(
          (sum, invoice) =>
            sum +
            Math.max(
              0,
              toSafeNumber(invoice.amount_total) - toSafeNumber(invoice.amount_paid)
            ),
          0
        )
  const overdueInvoicesCount =
    invoicesError instanceof Error
      ? 0
      : invoices.filter((invoice) => invoice.status === 'overdue').length
  const driverAdvances =
    expensesError instanceof Error
      ? 0
      : expenses.reduce(
          (sum, expense) =>
            expense.advanced_by_driver ? sum + toSafeNumber(expense.amount) : sum,
          0
        )
  const pendingExpenseApprovals =
    expensesError instanceof Error
      ? 0
      : expenses.filter((expense) => expense.approval_status === 'pending').length

  if (!authReady) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Checking Supabase session...</p>
        </div>
      </PageContainer>
    )
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-amber-200 bg-white p-8 text-center">
          <p className="text-sm text-amber-700">Sign in required to access protected data.</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Operational snapshot from live Supabase data"
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading missions...</p>
        ) : error instanceof Error ? (
          <div className="space-y-4">
            <p className="text-sm text-red-700">{error.message}</p>
            <button
              type="button"
              onClick={() => {
                void refetch()
              }}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatEuro(totalRevenue)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Estimated Cost</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatEuro(totalEstimatedCost)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Actual Cost</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatEuro(totalActualCost)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Margin</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatEuro(totalMargin)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Unpaid Cash</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatEuro(unpaidAmount)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Overdue Invoices</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {numberFormatter.format(overdueInvoicesCount)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Driver Advances</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatEuro(driverAdvances)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Pending Expense Approvals</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {numberFormatter.format(pendingExpenseApprovals)}
                </p>
              </div>
            </div>

            {missions.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Missions count: 0</p>
                <p className="text-sm text-gray-500">No missions returned from Supabase yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-900">
                  Missions count: {missions.length}
                </p>
                <ul className="space-y-2">
                  {missions.slice(0, 5).map((mission) => (
                    <li
                      key={mission.mission_id}
                      className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-gray-900">{mission.reference}</span>
                      <span className="text-gray-500">{mission.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
