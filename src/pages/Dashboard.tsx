import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { KPICard } from '../components/KPICard'
import { MissionListItem } from '../components/MissionListItem'
import { ExpenseListItem } from '../components/ExpenseListItem'
import { InvoiceListItem } from '../components/InvoiceListItem'
import { DashboardSection } from '../components/DashboardSection'
import { AlertCircle, TrendingUp } from 'lucide-react'
import {
  mockMissions,
  mockExpenses,
  mockDriverAdvances,
  mockClients,
  mockDrivers,
} from '../lib/mockData'
import { calculateInvoiceAmountRemaining, calculateInvoiceSummary } from '../lib/calculations'
import {
  getExpenseListStatus,
  getExpenseTypeLabel,
  getMissionListStatus,
  getVehicleServiceAlert,
} from '../lib/domain'
import { MissionStatus, InvoiceStatus } from '../types'
import { formatCurrencyWithDecimals } from '../lib/utils'
import { getStoredInvoices } from '../lib/financialStore'
import { getStoredVehicles } from '../lib/vehicleStore'

export function Dashboard() {
  const navigate = useNavigate()
  const getClientName = (clientId: string) =>
    mockClients.find((client) => client.client_id === clientId)?.name || '—'

  const getDriverName = (driverId?: string) =>
    driverId ? mockDrivers.find((driver) => driver.driver_id === driverId)?.name || '—' : 'Unassigned'

  const getMissionReference = (missionId?: string) =>
    missionId
      ? mockMissions.find((mission) => mission.mission_id === missionId)?.reference || '—'
      : '—'

  // Calculate KPIs from mock data
  const missionsInProgress = mockMissions.filter((m) => m.status === MissionStatus.InProgress).length
  const missionsDeliveredToday = mockMissions.filter(
    (m) => m.status === MissionStatus.Delivered && m.arrival_datetime?.split('T')[0] === '2026-03-28'
  ).length
  const expensesThisWeek = mockExpenses.reduce((sum, e) => sum + e.amount, 0)
  const driverAdvancesToReimburse = mockDriverAdvances.reduce((sum, da) => sum + da.amount, 0)
  const storedInvoices = getStoredInvoices()
  const invoiceSummary = calculateInvoiceSummary(storedInvoices)
  const overdueInvoices = invoiceSummary.overdueCount
  const overdueInvoicesAmount = invoiceSummary.overdueTotal
  const followUpInvoices = storedInvoices.filter((invoice) =>
    [InvoiceStatus.Sent, InvoiceStatus.Partial, InvoiceStatus.Overdue].includes(invoice.status)
  )

  const fleetVehicles = getStoredVehicles()
  const fleetAlerts = fleetVehicles
    .map((vehicle) => ({
      vehicle: vehicle.name,
      alert: getVehicleServiceAlert(vehicle.mileage_current, vehicle.next_service_mileage),
    }))
    .filter(({ alert }) => alert.level !== 'normal')

  const vehiclesNeedingService = fleetAlerts.length
  const activeFleetSize = fleetVehicles.length
  const averageMissionCost =
    mockMissions.filter((mission) => mission.actual_cost_amount !== undefined).length > 0
      ? mockMissions.reduce((sum, mission) => sum + (mission.actual_cost_amount || 0), 0) /
        mockMissions.filter((mission) => mission.actual_cost_amount !== undefined).length
      : 0

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Operations overview and key metrics" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KPICard
          label="Missions In Progress"
          value={missionsInProgress}
          icon={<TrendingUp size={20} />}
        />
        <KPICard
          label="Delivered Today"
          value={missionsDeliveredToday}
        />
        <KPICard
          label="Tracked Expenses"
          value={formatCurrencyWithDecimals(expensesThisWeek)}
        />
        <KPICard
          label="Driver Advances Due"
          value={formatCurrencyWithDecimals(driverAdvancesToReimburse)}
          variant={driverAdvancesToReimburse > 0 ? 'alert' : 'default'}
          change={`${mockDriverAdvances.length} drivers`}
          trend={driverAdvancesToReimburse > 0 ? 'up' : 'neutral'}
        />
        <KPICard
          label="Overdue Invoices"
          value={overdueInvoices}
          change={`${formatCurrencyWithDecimals(overdueInvoicesAmount)} outstanding`}
          variant={overdueInvoices > 0 ? 'alert' : 'default'}
          trend={overdueInvoices > 0 ? 'up' : 'neutral'}
          icon={overdueInvoices > 0 && <AlertCircle size={20} className="text-red-600" />}
        />
        <KPICard
          label="Vehicles Needing Service"
          value={vehiclesNeedingService}
          change="Action required"
          variant={vehiclesNeedingService > 0 ? 'alert' : 'default'}
        />
      </div>

      {/* Main sections */}
      <div className="space-y-8">
        {/* Today's Missions */}
        <DashboardSection title="Today's Missions" description="Active and completed deliveries">
          <div className="divide-y divide-gray-100">
            {mockMissions.length > 0 ? (
              mockMissions.map((mission) => (
                <MissionListItem
                  key={mission.mission_id}
                  id={mission.mission_id}
                  reference={mission.reference}
                  client={getClientName(mission.client_id)}
                  route={`${mission.departure_location} → ${mission.arrival_location}`}
                  driver={getDriverName(mission.driver_id)}
                  status={getMissionListStatus(mission.status)}
                  revenue={mission.revenue_amount}
                />
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No missions scheduled for today
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Recent Expenses */}
        <DashboardSection title="Recent Expenses" description="Latest tracked costs and driver advances">
          <div className="divide-y divide-gray-100">
            {mockExpenses.length > 0 ? (
              mockExpenses.map((expense) => (
                <ExpenseListItem
                  key={expense.expense_id}
                  id={expense.expense_id}
                  mission={getMissionReference(expense.mission_id)}
                  category={getExpenseTypeLabel(expense.type)}
                  amount={expense.amount}
                  driver={getDriverName(expense.driver_id)}
                  status={getExpenseListStatus(expense.reimbursement_status)}
                  advancedByDriver={expense.advanced_by_driver}
                />
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No expenses logged yet
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Invoices Requiring Follow-up */}
        <DashboardSection 
          title="Invoices Requiring Follow-up" 
          description="Sent, overdue, and partial payments"
        >
          <div className="divide-y divide-gray-100">
            {followUpInvoices.length > 0 ? (
              followUpInvoices.map((invoice) => (
                  <InvoiceListItem
                    key={invoice.invoice_id}
                    id={invoice.invoice_id}
                    reference={invoice.invoice_number}
                    client={getClientName(invoice.client_id)}
                    amount={calculateInvoiceAmountRemaining(invoice.amount_total, invoice.amount_paid)}
                    status={invoice.status}
                    dueDate={invoice.due_date}
                    onClick={() => navigate(`/invoices/${invoice.invoice_id}`)}
                  />
                ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                All invoices resolved
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Fleet Alerts */}
        <DashboardSection title="Fleet Alerts" description="Maintenance and service reminders">
          <div className="divide-y divide-gray-100">
            {fleetAlerts.length > 0 ? (
              fleetAlerts.map((alert, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors duration-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.vehicle}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {alert.alert.label} • {alert.alert.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No fleet alerts
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Operational Summary */}
        <DashboardSection title="Operational Summary" description="Current operating snapshot">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Weekly Revenue
              </p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {formatCurrencyWithDecimals(
                  mockMissions.reduce((sum, mission) => sum + mission.revenue_amount, 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Average Mission Cost
              </p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {formatCurrencyWithDecimals(averageMissionCost)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Fleet Utilization
              </p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {activeFleetSize > 0 ? ((missionsInProgress / activeFleetSize) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </DashboardSection>
      </div>
    </PageContainer>
  )
}
