import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { KPICard } from '../components/KPICard'
import { MissionListItem } from '../components/MissionListItem'
import { ExpenseListItem } from '../components/ExpenseListItem'
import { InvoiceListItem } from '../components/InvoiceListItem'
import { DashboardSection } from '../components/DashboardSection'
import { AlertCircle, TrendingUp } from 'lucide-react'
import { mockMissions, mockExpenses, mockInvoices, mockDriverAdvances, mockFleetAlerts } from '../lib/mockData'
import { MissionStatus, InvoiceStatus, ExpenseType } from '../types'

export function Dashboard() {
  // Calculate KPIs from mock data
  const missionsInProgress = mockMissions.filter((m) => m.status === MissionStatus.InProgress).length
  const missionsDeliveredToday = mockMissions.filter(
    (m) => m.status === MissionStatus.Delivered && m.arrival_datetime?.split('T')[0] === '2026-03-28'
  ).length
  const expensesThisWeek = mockExpenses.reduce((sum, e) => sum + e.amount, 0)
  const driverAdvancesToReimburse = mockDriverAdvances.reduce((sum, da) => sum + da.amount, 0)
  const overdueInvoices = mockInvoices.filter((i) => i.status === InvoiceStatus.Overdue).length
  const overdueInvoicesAmount = mockInvoices
    .filter((i) => i.status === InvoiceStatus.Overdue)
    .reduce((sum, i) => sum + (i.amount_total - i.amount_paid), 0)

  const vehiclesNeedingService = mockFleetAlerts.length

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
          change="+2 vs yesterday"
        />
        <KPICard
          label="Tracked Expenses"
          value={`€${expensesThisWeek.toFixed(2)}`}
          change="This week"
        />
        <KPICard
          label="Driver Advances Due"
          value={`€${driverAdvancesToReimburse.toFixed(2)}`}
          variant={driverAdvancesToReimburse > 0 ? 'alert' : 'default'}
          change={`${mockDriverAdvances.length} drivers`}
          trend={driverAdvancesToReimburse > 0 ? 'up' : 'neutral'}
        />
        <KPICard
          label="Overdue Invoices"
          value={overdueInvoices}
          change={`€${overdueInvoicesAmount.toFixed(2)} outstanding`}
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
                  client={`Client`}
                  route={`${mission.departure_location} → ${mission.arrival_location}`}
                  driver={`Driver ${mission.driver_id?.split('-')[1] || 'Unassigned'}`}
                  status={
                    mission.status === MissionStatus.InProgress
                      ? 'in_progress'
                      : mission.status === MissionStatus.Delivered
                        ? 'delivered'
                        : mission.status === MissionStatus.Cancelled
                          ? 'cancelled'
                          : 'pending'
                  }
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
                  mission={`Mission ${expense.mission_id?.split('-')[3] || 'N/A'}`}
                  category={
                    expense.type === ExpenseType.Fuel
                      ? 'Fuel'
                      : expense.type === ExpenseType.Tolls
                        ? 'Tolls'
                        : expense.type === ExpenseType.Parking
                          ? 'Parking'
                          : expense.type === ExpenseType.Maintenance
                            ? 'Maintenance'
                            : 'Other'
                  }
                  amount={expense.amount}
                  driver={`Driver ${expense.driver_id?.split('-')[1] || 'N/A'}`}
                  status={expense.receipt_attached ? 'pending' : 'pending'}
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
            {mockInvoices.filter((i) => [InvoiceStatus.Sent, InvoiceStatus.Overdue, InvoiceStatus.Partial].includes(i.status))
              .length > 0 ? (
              mockInvoices
                .filter((i) => [InvoiceStatus.Sent, InvoiceStatus.Overdue, InvoiceStatus.Partial].includes(i.status))
                .map((invoice) => (
                  <InvoiceListItem
                    key={invoice.invoice_id}
                    id={invoice.invoice_id}
                    reference={invoice.invoice_number}
                    client={`Client ${invoice.client_id?.split('-')[1]}`}
                    amount={invoice.amount_total - invoice.amount_paid}
                    status={
                      invoice.status === InvoiceStatus.Overdue
                        ? 'overdue'
                        : invoice.status === InvoiceStatus.Sent
                          ? 'sent'
                          : invoice.status === InvoiceStatus.Partial
                            ? 'partial'
                            : 'draft'
                    }
                    dueDate={new Date(invoice.due_date).toLocaleDateString('fr-FR', {
                      month: 'short',
                      day: 'numeric',
                    })}
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
            {mockFleetAlerts.length > 0 ? (
              mockFleetAlerts.map((alert, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors duration-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.vehicle}</p>
                      <p className="text-xs text-gray-600 mt-1">{alert.alert}</p>
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
        <DashboardSection title="Operational Summary" description={`Data as of 28 mars 2026, 15:30`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Weekly Revenue
              </p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                €{mockMissions.reduce((sum, m) => sum + m.revenue_amount, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Average Mission Cost
              </p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                €{(mockMissions.reduce((sum, m) => sum + (m.actual_cost_amount || 0), 0) / mockMissions.filter(m => m.actual_cost_amount).length).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Fleet Utilization
              </p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {((missionsInProgress / 5) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </DashboardSection>
      </div>
    </PageContainer>
  )
}
