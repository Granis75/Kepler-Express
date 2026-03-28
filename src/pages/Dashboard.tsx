import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, TrendingUp } from 'lucide-react'
import { DashboardSection } from '../components/DashboardSection'
import { ExpenseListItem } from '../components/ExpenseListItem'
import { InvoiceListItem } from '../components/InvoiceListItem'
import { KPICard } from '../components/KPICard'
import { MissionListItem } from '../components/MissionListItem'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { calculateInvoiceAmountRemaining, calculateInvoiceSummary } from '../lib/calculations'
import {
  getExpenseListStatus,
  getExpenseTypeLabel,
  getMissionListStatus,
  getVehicleServiceAlert,
  isOutstandingReimbursementStatus,
} from '../lib/domain'
import {
  listClients,
  listDrivers,
  listExpenses,
  listInvoices,
  listMissions,
  listVehicles,
  useAsyncData,
} from '../lib/data'
import { InvoiceStatus, MissionStatus } from '../types'
import { formatCurrencyWithDecimals } from '../lib/utils'

function isSameDay(dateValue?: string) {
  if (!dateValue) {
    return false
  }

  const candidate = new Date(dateValue)
  const today = new Date()

  return (
    candidate.getFullYear() === today.getFullYear() &&
    candidate.getMonth() === today.getMonth() &&
    candidate.getDate() === today.getDate()
  )
}

function isWithinLastSevenDays(dateValue: string) {
  const candidate = new Date(dateValue)
  const threshold = new Date()
  threshold.setHours(0, 0, 0, 0)
  threshold.setDate(threshold.getDate() - 6)

  return candidate.getTime() >= threshold.getTime()
}

export function Dashboard() {
  const navigate = useNavigate()

  const loadDashboardData = useCallback(
    () =>
      Promise.all([
        listClients(),
        listDrivers(),
        listMissions(),
        listExpenses(),
        listVehicles(),
        listInvoices(),
      ]),
    []
  )
  const { data, loading, error, reload } = useAsyncData(loadDashboardData, [])

  const clients = data?.[0] ?? []
  const drivers = data?.[1] ?? []
  const missions = data?.[2] ?? []
  const expenses = data?.[3] ?? []
  const vehicles = data?.[4] ?? []
  const invoices = data?.[5] ?? []

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.client_id, client.name] as const)),
    [clients]
  )
  const driverNameById = useMemo(
    () => new Map(drivers.map((driver) => [driver.driver_id, driver.name] as const)),
    [drivers]
  )
  const missionReferenceById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission.reference] as const)),
    [missions]
  )

  if (loading) {
    return (
      <PageContainer>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </PageContainer>
    )
  }

  if (error || !data) {
    return (
      <PageContainer>
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error || 'Unable to load the dashboard.'}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageContainer>
    )
  }

  const missionsInProgress = missions.filter(
    (mission) => mission.status === MissionStatus.InProgress
  ).length
  const missionsDeliveredToday = missions.filter(
    (mission) =>
      mission.status === MissionStatus.Delivered &&
      isSameDay(mission.arrival_datetime ?? mission.departure_datetime)
  ).length
  const expensesLast7Days = expenses
    .filter((expense) => isWithinLastSevenDays(expense.expense_date))
    .reduce((sum, expense) => sum + expense.amount, 0)

  const outstandingAdvances = expenses.filter(
    (expense) =>
      expense.advanced_by_driver &&
      isOutstandingReimbursementStatus(expense.reimbursement_status)
  )
  const driverAdvancesToReimburse = outstandingAdvances.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )
  const driversAwaitingReimbursement = new Set(
    outstandingAdvances.map((expense) => expense.driver_id).filter(Boolean)
  ).size

  const invoiceSummary = calculateInvoiceSummary(invoices)
  const followUpInvoices = [...invoices]
    .filter((invoice) =>
      [InvoiceStatus.Sent, InvoiceStatus.Partial, InvoiceStatus.Overdue].includes(invoice.status)
    )
    .sort((left, right) => {
      if (left.status === InvoiceStatus.Overdue && right.status !== InvoiceStatus.Overdue) {
        return -1
      }

      if (left.status !== InvoiceStatus.Overdue && right.status === InvoiceStatus.Overdue) {
        return 1
      }

      return new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
    })
    .slice(0, 6)

  const fleetAlerts = vehicles
    .map((vehicle) => ({
      vehicle,
      alert: getVehicleServiceAlert(vehicle.mileage_current, vehicle.next_service_mileage),
    }))
    .filter(({ alert }) => alert.level !== 'normal')
    .sort((left, right) => {
      const severityOrder = { due: 0, critical: 1, warning: 2, normal: 3 }
      return severityOrder[left.alert.level] - severityOrder[right.alert.level]
    })

  const priorityMissions = [...missions]
    .sort((left, right) => {
      const leftPriority =
        left.status === MissionStatus.InProgress || left.status === MissionStatus.Issue ? 0 : 1
      const rightPriority =
        right.status === MissionStatus.InProgress || right.status === MissionStatus.Issue ? 0 : 1

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      return (
        new Date(right.departure_datetime).getTime() -
        new Date(left.departure_datetime).getTime()
      )
    })
    .slice(0, 6)

  const recentExpenses = [...expenses]
    .sort(
      (left, right) =>
        new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime()
    )
    .slice(0, 6)

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Live view across missions, costs, billing, and fleet"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KPICard
          label="Missions in progress"
          value={missionsInProgress}
          icon={<TrendingUp size={20} />}
        />
        <KPICard label="Delivered today" value={missionsDeliveredToday} />
        <KPICard
          label="Expenses last 7 days"
          value={formatCurrencyWithDecimals(expensesLast7Days)}
        />
        <KPICard
          label="Driver advances due"
          value={formatCurrencyWithDecimals(driverAdvancesToReimburse)}
          variant={driverAdvancesToReimburse > 0 ? 'alert' : 'default'}
          change={
            driversAwaitingReimbursement > 0
              ? `${driversAwaitingReimbursement} drivers`
              : undefined
          }
          trend={driverAdvancesToReimburse > 0 ? 'up' : 'neutral'}
        />
        <KPICard
          label="Overdue invoices"
          value={invoiceSummary.overdueCount}
          change={`${formatCurrencyWithDecimals(invoiceSummary.overdueTotal)} outstanding`}
          variant={invoiceSummary.overdueCount > 0 ? 'alert' : 'default'}
          trend={invoiceSummary.overdueCount > 0 ? 'up' : 'neutral'}
          icon={
            invoiceSummary.overdueCount > 0 ? (
              <AlertCircle size={20} className="text-red-600" />
            ) : undefined
          }
        />
        <KPICard
          label="Vehicles needing service"
          value={fleetAlerts.length}
          change={fleetAlerts.length > 0 ? 'Action required' : undefined}
          variant={fleetAlerts.length > 0 ? 'alert' : 'default'}
        />
      </div>

      <div className="space-y-8">
        <DashboardSection
          title="Priority missions"
          description="Active work first, then the latest completed runs"
        >
          <div className="divide-y divide-gray-100">
            {priorityMissions.length > 0 ? (
              priorityMissions.map((mission) => (
                <MissionListItem
                  key={mission.mission_id}
                  reference={mission.reference}
                  client={clientNameById.get(mission.client_id) ?? mission.client_id}
                  route={`${mission.departure_location} → ${mission.arrival_location}`}
                  driver={
                    mission.driver_id
                      ? driverNameById.get(mission.driver_id) ?? mission.driver_id
                      : 'No driver assigned'
                  }
                  status={getMissionListStatus(mission.status)}
                  revenue={mission.revenue_amount}
                  onClick={() => navigate(`/missions/${mission.mission_id}`)}
                />
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No missions are available yet.
              </div>
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Recent expenses"
          description="Latest tracked costs and reimbursements"
        >
          <div className="divide-y divide-gray-100">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => (
                <ExpenseListItem
                  key={expense.expense_id}
                  mission={
                    expense.mission_id
                      ? missionReferenceById.get(expense.mission_id) ?? expense.mission_id
                      : 'No mission linked'
                  }
                  category={getExpenseTypeLabel(expense.type)}
                  amount={expense.amount}
                  driver={
                    expense.driver_id
                      ? driverNameById.get(expense.driver_id) ?? expense.driver_id
                      : 'No driver linked'
                  }
                  status={getExpenseListStatus(expense.reimbursement_status)}
                  advancedByDriver={expense.advanced_by_driver}
                  onClick={() => navigate('/expenses')}
                />
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No expenses have been recorded yet.
              </div>
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Invoices requiring follow-up"
          description="Outstanding, partial, and overdue billing"
        >
          <div className="divide-y divide-gray-100">
            {followUpInvoices.length > 0 ? (
              followUpInvoices.map((invoice) => (
                <InvoiceListItem
                  key={invoice.invoice_id}
                  reference={invoice.invoice_number}
                  client={clientNameById.get(invoice.client_id) ?? invoice.client_id}
                  amount={calculateInvoiceAmountRemaining(invoice.amount_total, invoice.amount_paid)}
                  status={invoice.status}
                  dueDate={invoice.due_date}
                  onClick={() => navigate(`/invoices/${invoice.invoice_id}`)}
                />
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No invoice follow-up is required right now.
              </div>
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Fleet alerts"
          description="Maintenance items that need attention"
        >
          <div className="divide-y divide-gray-100">
            {fleetAlerts.length > 0 ? (
              fleetAlerts.map(({ vehicle, alert }) => (
                <button
                  key={vehicle.vehicle_id}
                  type="button"
                  onClick={() => navigate(`/vehicles/${vehicle.vehicle_id}`)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors duration-100"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {alert.label} • {alert.detail}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No fleet alerts at the moment.
              </div>
            )}
          </div>
        </DashboardSection>
      </div>
    </PageContainer>
  )
}
