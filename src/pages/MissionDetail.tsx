import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { ArrowLeft, Edit2 } from 'lucide-react'
import { mockMissions, mockClients, mockDrivers, mockVehicles, mockExpenses, mockInvoices } from '../lib/mockData'
import { MissionStatus } from '../types'

export function MissionDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const mission = mockMissions.find((m) => m.mission_id === id)
  if (!mission) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Mission not found</p>
        </div>
      </PageContainer>
    )
  }

  const client = mockClients.find((c) => c.client_id === mission.client_id)
  const driver = mission.driver_id ? mockDrivers.find((d) => d.driver_id === mission.driver_id) : null
  const vehicle = mission.vehicle_id ? mockVehicles.find((v) => v.vehicle_id === mission.vehicle_id) : null
  const linkedExpenses = mockExpenses.filter((e) => e.mission_id === mission.mission_id)
  const linkedInvoice = mockInvoices.find((i) => i.mission_ids.includes(mission.mission_id))

  // Calculate profitability
  const totalExpenses = linkedExpenses.reduce((sum, e) => sum + e.amount, 0) + (mission.actual_cost_amount || mission.estimated_cost_amount || 0)
  const profitability = mission.revenue_amount - totalExpenses
  const margin = ((profitability / mission.revenue_amount) * 100).toFixed(1)

  const statusLabels: Record<MissionStatus, string> = {
    [MissionStatus.Planned]: 'Planned',
    [MissionStatus.Assigned]: 'Assigned',
    [MissionStatus.InProgress]: 'In Progress',
    [MissionStatus.Delivered]: 'Delivered',
    [MissionStatus.Issue]: 'Issue',
    [MissionStatus.Cancelled]: 'Cancelled',
  }

  const statusStyles: Record<MissionStatus, string> = {
    [MissionStatus.Planned]: 'bg-gray-50 text-gray-700 border-gray-200',
    [MissionStatus.Assigned]: 'bg-blue-50 text-blue-700 border-blue-200',
    [MissionStatus.InProgress]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    [MissionStatus.Delivered]: 'bg-green-50 text-green-700 border-green-200',
    [MissionStatus.Issue]: 'bg-red-50 text-red-700 border-red-200',
    [MissionStatus.Cancelled]: 'bg-gray-100 text-gray-600 border-gray-300',
  }

  return (
    <PageContainer>
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/missions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-gray-900">{mission.reference}</h1>
              <span className={`inline-flex text-sm font-semibold px-3 py-1 rounded border ${statusStyles[mission.status]}`}>
                {statusLabels[mission.status]}
              </span>
            </div>
            <p className="text-sm text-gray-600">{client?.name}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/missions/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-900"
        >
          <Edit2 size={16} />
          Edit
        </button>
      </div>

      <div className="space-y-6">
        {/* Route & Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Route</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Pickup</p>
                <p className="text-sm text-gray-900">{mission.departure_location}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Delivery</p>
                <p className="text-sm text-gray-900">{mission.arrival_location}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(mission.departure_datetime).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Assignment</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Driver</p>
                <p className="text-sm text-gray-900">{driver?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Vehicle</p>
                <p className="text-sm text-gray-900">{vehicle?.name || 'No Vehicle'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">€{mission.revenue_amount.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Total Costs</p>
            <p className="text-2xl font-semibold text-gray-900">€{totalExpenses.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Est. {mission.estimated_cost_amount} + Exp. {linkedExpenses.length}</p>
          </div>
          <div className={`rounded-lg p-6 ${profitability >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Profitability</p>
            <p className={`text-2xl font-semibold ${profitability >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              €{profitability.toFixed(2)}
            </p>
            <p className={`text-xs mt-1 ${profitability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {margin}% margin
            </p>
          </div>
        </div>

        {/* Linked Expenses */}
        {linkedExpenses.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Linked Expenses</h2>
            <div className="space-y-2">
              {linkedExpenses.map((expense) => (
                <div key={expense.expense_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900">{expense.description}</p>
                    <p className="text-xs text-gray-500">{new Date(expense.expense_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">€{expense.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Invoice */}
        {linkedInvoice && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Linked Invoice</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{linkedInvoice.invoice_number}</p>
                <p className="text-xs text-gray-500">Due: {new Date(linkedInvoice.due_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">€{linkedInvoice.amount_total.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {mission.notes && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-sm text-gray-700">{mission.notes}</p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
