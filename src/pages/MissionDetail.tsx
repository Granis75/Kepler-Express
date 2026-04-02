import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { ArrowLeft, Edit2 } from 'lucide-react'
import { calculateInvoiceAmountRemaining } from '../lib/calculations'
import { getMissionStatusConfig, getInvoiceStatusConfig } from '../lib/domain'
import { useAuthState } from '../lib/auth'
import { useClients, useExpenses, useInvoices, useMission } from '../hooks'
import { formatCurrencyWithDecimals, formatDate, toFiniteNumber } from '../lib/utils'

export function MissionDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { authReady, user } = useAuthState()
  const canLoadProtectedData = authReady && Boolean(user)
  const {
    data: mission,
    isLoading: missionLoading,
    error: missionError,
    refetch: refetchMission,
  } = useMission(id, canLoadProtectedData)
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useClients(canLoadProtectedData)
  const {
    data: expenses = [],
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses(canLoadProtectedData)
  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices(canLoadProtectedData)
  const loading = missionLoading || clientsLoading || expensesLoading || invoicesLoading
  const error =
    (missionError instanceof Error && missionError.message) ||
    (clientsError instanceof Error && clientsError.message) ||
    (expensesError instanceof Error && expensesError.message) ||
    (invoicesError instanceof Error && invoicesError.message) ||
    null

  const linkedExpenses = useMemo(
    () => expenses.filter((expense) => expense.mission_id === mission?.mission_id),
    [expenses, mission?.mission_id]
  )
  const linkedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.mission_ids.includes(mission?.mission_id ?? '')),
    [invoices, mission?.mission_id]
  )

  if (!authReady) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Checking Supabase session...</p>
        </div>
      </PageContainer>
    )
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="bg-white border border-amber-200 rounded-lg p-8 text-center">
          <p className="text-sm text-amber-700">Sign in required to access protected data.</p>
        </div>
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading mission...</p>
        </div>
      </PageContainer>
    )
  }

  if (error || !mission) {
    return (
      <PageContainer>
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error || 'Mission not found or inaccessible.'}</p>
          <button
            type="button"
            onClick={() => {
              void Promise.all([
                refetchMission(),
                refetchClients(),
                refetchExpenses(),
                refetchInvoices(),
              ])
            }}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageContainer>
    )
  }

  const client = clients.find((item) => item.client_id === mission.client_id)

  const totalExpenses =
    linkedExpenses.reduce((sum, expense) => sum + toFiniteNumber(expense.amount), 0) +
    toFiniteNumber(mission.actual_cost_amount ?? mission.estimated_cost_amount)
  const profitability = toFiniteNumber(mission.revenue_amount) - totalExpenses
  const margin =
    toFiniteNumber(mission.revenue_amount) > 0
      ? ((profitability / toFiniteNumber(mission.revenue_amount)) * 100).toFixed(1)
      : '0.0'

  const statusConfig = getMissionStatusConfig(mission.status)

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
              <span className={`inline-flex text-sm font-semibold px-3 py-1 rounded border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">{client?.name || '—'}</p>
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
                  {formatDate(mission.departure_datetime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Assignment</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Driver</p>
                <p className="text-sm text-gray-900">
                  {mission.driver_name ?? 'No driver assigned'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Vehicle</p>
                <p className="text-sm text-gray-900">
                  {mission.vehicle_name ?? 'No vehicle assigned'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrencyWithDecimals(mission.revenue_amount)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Total Costs</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrencyWithDecimals(totalExpenses)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Estimate {formatCurrencyWithDecimals(mission.estimated_cost_amount)} • {linkedExpenses.length} expenses
            </p>
          </div>
          <div className={`rounded-lg p-6 ${profitability >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Profitability</p>
            <p className={`text-2xl font-semibold ${profitability >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrencyWithDecimals(profitability)}
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
                    {expense.notes && <p className="text-sm text-gray-900">{expense.notes}</p>}
                    <p className="text-xs text-gray-500">{formatDate(expense.expense_date)}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatCurrencyWithDecimals(expense.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Invoice */}
        {linkedInvoice && (
          <button
            type="button"
            onClick={() => navigate(`/invoices/${linkedInvoice.invoice_id}`)}
            className="w-full text-left bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Linked Invoice</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{linkedInvoice.invoice_number}</p>
                  <span
                    className={`inline-flex text-xs font-medium px-2 py-0.5 rounded border ${getInvoiceStatusConfig(linkedInvoice.status).color}`}
                  >
                    {getInvoiceStatusConfig(linkedInvoice.status).label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Due: {formatDate(linkedInvoice.due_date)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrencyWithDecimals(linkedInvoice.amount_total)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Due {formatCurrencyWithDecimals(
                    calculateInvoiceAmountRemaining(
                      linkedInvoice.amount_total,
                      linkedInvoice.amount_paid
                    )
                  )}
                </p>
              </div>
            </div>
          </button>
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
