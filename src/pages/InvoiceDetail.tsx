import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit2, Plus } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { MissionListItem } from '../components/MissionListItem'
import { PaymentForm } from '../components/PaymentForm'
import {
  calculateInvoiceAmountRemaining,
  calculateInvoicePaymentPercentage,
} from '../lib/calculations'
import {
  addStoredPayment,
  getStoredInvoiceById,
  getStoredPaymentsByInvoiceId,
} from '../lib/financialStore'
import { mockClients, mockDrivers, mockMissions } from '../lib/mockData'
import {
  getInvoiceStatusConfig,
  getMissionListStatus,
  getPaymentMethodConfig,
} from '../lib/domain'
import { formatCurrencyWithDecimals, formatDate, formatPercentage } from '../lib/utils'
import { InvoiceStatus } from '../types'

export function InvoiceDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  void refreshToken

  const invoice = id ? getStoredInvoiceById(id) : undefined

  if (!invoice) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Invoice not found</p>
        </div>
      </PageContainer>
    )
  }

  const payments = getStoredPaymentsByInvoiceId(invoice.invoice_id)
  const client = mockClients.find((item) => item.client_id === invoice.client_id)
  const relatedMissions = mockMissions.filter((mission) =>
    invoice.mission_ids.includes(mission.mission_id)
  )
  const amountRemaining = calculateInvoiceAmountRemaining(
    invoice.amount_total,
    invoice.amount_paid
  )
  const paymentProgress = calculateInvoicePaymentPercentage(
    invoice.amount_total,
    invoice.amount_paid
  )
  const statusConfig = getInvoiceStatusConfig(invoice.status)
  const latestPayment = payments[0]

  const handlePaymentSubmit = (data: Parameters<typeof addStoredPayment>[0]) => {
    addStoredPayment(data)
    setShowPaymentForm(false)
    setRefreshToken((value) => value + 1)
  }

  return (
    <PageContainer>
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-gray-900">
                {invoice.invoice_number}
              </h1>
              <span
                className={`inline-flex text-sm font-semibold px-3 py-1 rounded border ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">{client?.name || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {invoice.status !== InvoiceStatus.Draft && amountRemaining > 0 && (
            <button
              type="button"
              onClick={() => setShowPaymentForm((value) => !value)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Plus size={16} />
              Add Payment
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(`/invoices/${invoice.invoice_id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-900"
          >
            <Edit2 size={16} />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Total Amount
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrencyWithDecimals(invoice.amount_total)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Paid To Date
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrencyWithDecimals(invoice.amount_paid)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Remaining Due
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrencyWithDecimals(amountRemaining)}
          </p>
        </div>
        <div
          className={`rounded-lg border p-6 ${
            invoice.status === InvoiceStatus.Overdue
              ? 'border-red-200 bg-red-50'
              : invoice.status === InvoiceStatus.Partial
                ? 'border-amber-200 bg-amber-50'
                : 'border-gray-200 bg-white'
          }`}
        >
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Collection Progress
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatPercentage(paymentProgress, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {payments.length} payments recorded
          </p>
        </div>
      </div>

      {showPaymentForm && (
        <div className="mb-6">
          <PaymentForm
            invoice={invoice}
            onSubmit={handlePaymentSubmit}
            onCancel={() => setShowPaymentForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Invoice Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Client
                </p>
                <p className="text-gray-900">{client?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Issue Date
                </p>
                <p className="text-gray-900">{formatDate(invoice.issued_date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Due Date
                </p>
                <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Last Payment
                </p>
                <p className="text-gray-900">
                  {latestPayment ? formatDate(latestPayment.payment_date) : '—'}
                </p>
              </div>
            </div>
            {invoice.notes && (
              <div className="mt-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Notes
                </p>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Linked Missions
            </h2>
            {relatedMissions.length > 0 ? (
              <div className="space-y-3">
                {relatedMissions.map((mission) => {
                  const driver = mission.driver_id
                    ? mockDrivers.find((item) => item.driver_id === mission.driver_id)
                    : undefined

                  return (
                    <MissionListItem
                      key={mission.mission_id}
                      id={mission.mission_id}
                      reference={mission.reference}
                      client={client?.name || '—'}
                      route={`${mission.departure_location} → ${mission.arrival_location}`}
                      driver={driver?.name || 'Unassigned'}
                      status={getMissionListStatus(mission.status)}
                      revenue={mission.revenue_amount}
                      onClick={() => navigate(`/missions/${mission.mission_id}`)}
                    />
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No missions linked to this invoice.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Collection Summary
            </h2>
            <div className="space-y-4 text-sm">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    invoice.status === InvoiceStatus.Paid
                      ? 'bg-green-500'
                      : invoice.status === InvoiceStatus.Overdue
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-gray-900">{statusConfig.label}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Collected</span>
                <span className="font-medium text-gray-900">
                  {formatCurrencyWithDecimals(invoice.amount_paid)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Balance due</span>
                <span className="font-medium text-gray-900">
                  {formatCurrencyWithDecimals(amountRemaining)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Payment progress</span>
                <span className="font-medium text-gray-900">
                  {formatPercentage(paymentProgress, 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Payments
            </h2>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const methodConfig = getPaymentMethodConfig(payment.payment_method)

                  return (
                    <div
                      key={payment.payment_id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`inline-flex text-xs font-medium px-2 py-0.5 rounded ${methodConfig.color}`}
                            >
                              {methodConfig.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(payment.payment_date)}
                            </span>
                          </div>
                          {payment.notes && (
                            <p className="text-sm text-gray-900">{payment.notes}</p>
                          )}
                          {payment.reference && (
                            <p className="text-xs text-gray-500 mt-2">
                              Ref {payment.reference}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrencyWithDecimals(payment.amount)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No payments logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
