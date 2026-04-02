import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit2, Plus } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { MissionListItem } from '../components/MissionListItem'
import { PaymentForm } from '../components/PaymentForm'
import { useAuthState } from '../lib/auth'
import { createPaymentRecord, type CreatePaymentInput } from '../lib/api/payments'
import { calculateInvoicePaymentPercentage } from '../lib/calculations'
import {
  getInvoiceStatusConfig,
  getMissionListStatus,
  getPaymentMethodConfig,
} from '../lib/domain'
import { useClients, useInvoice, useMissions, usePaymentsByInvoice } from '../hooks'
import {
  formatCurrencyWithDecimals,
  formatDate,
  formatPercentage,
} from '../lib/utils'
import { InvoiceStatus, PaymentMethod } from '../types'

function toPaymentMethod(value: CreatePaymentInput['payment_method']): PaymentMethod {
  switch (value) {
    case 'bank_transfer':
      return PaymentMethod.BankTransfer
    case 'check':
      return PaymentMethod.Check
    case 'cash':
      return PaymentMethod.Cash
    case 'card':
      return PaymentMethod.Card
    default:
      return PaymentMethod.Other
  }
}

export function InvoiceDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { authReady, user } = useAuthState()
  const canLoadProtectedData = authReady && Boolean(user)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const {
    data: invoice,
    isLoading: invoiceLoading,
    error: invoiceError,
    refetch: refetchInvoice,
  } = useInvoice(id, canLoadProtectedData)
  const {
    data: payments = [],
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePaymentsByInvoice(id, canLoadProtectedData)
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
  } = useClients(canLoadProtectedData)
  const {
    data: missions = [],
    isLoading: missionsLoading,
    error: missionsError,
  } = useMissions(canLoadProtectedData)
  const loading = invoiceLoading || paymentsLoading || clientsLoading || missionsLoading
  const error =
    (invoiceError instanceof Error && invoiceError.message) ||
    (clientsError instanceof Error && clientsError.message) ||
    (missionsError instanceof Error && missionsError.message) ||
    null

  if (!authReady) {
    return (
      <PageContainer>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Checking Supabase session...</p>
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
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </PageContainer>
    )
  }

  if (error || !invoice) {
    return (
      <PageContainer>
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error || 'Invoice not found or inaccessible'}</p>
          <button
            type="button"
            onClick={() => {
              void Promise.all([refetchInvoice(), refetchPayments()])
            }}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageContainer>
    )
  }

  const client = clients.find((item) => item.client_id === invoice.client_id)
  const relatedMissions = missions.filter((mission) =>
    invoice.mission_ids.includes(mission.mission_id)
  )
  const amountRemaining = Math.max(0, invoice.amount_total - invoice.amount_paid)
  const paymentProgress = calculateInvoicePaymentPercentage(
    invoice.amount_total,
    invoice.amount_paid
  )
  const statusConfig = getInvoiceStatusConfig(invoice.status)
  const latestPayment = payments[0]
  const paymentLoadError = paymentsError instanceof Error ? paymentsError.message : null

  const paymentHistory = [...payments].sort(
    (left, right) =>
      new Date(right.payment_date).getTime() - new Date(left.payment_date).getTime()
  )

  const handlePaymentSubmit = async (payment: CreatePaymentInput) => {
    setIsSavingPayment(true)
    setPaymentError(null)

    try {
      await createPaymentRecord(payment)
      setShowPaymentForm(false)
      await Promise.all([refetchInvoice(), refetchPayments()])
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Unable to save the payment.')
    } finally {
      setIsSavingPayment(false)
    }
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
              <h1 className="text-3xl font-semibold text-gray-900">{invoice.invoice_number}</h1>
              <span
                className={`inline-flex text-sm font-semibold px-3 py-1 rounded border ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">{client?.name ?? invoice.client_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {invoice.status !== InvoiceStatus.Draft && amountRemaining > 0 && (
            <button
              type="button"
              onClick={() => {
                setPaymentError(null)
                setShowPaymentForm((value) => !value)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Plus size={16} />
              Add payment
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
            Total amount
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrencyWithDecimals(invoice.amount_total)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Paid to date
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrencyWithDecimals(invoice.amount_paid)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Remaining due
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
            Collection progress
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatPercentage(paymentProgress, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">{payments.length} payments recorded</p>
        </div>
      </div>

      {showPaymentForm && (
        <div className="mb-6">
          {paymentError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {paymentError}
            </div>
          )}
          <PaymentForm
            invoice={invoice}
            onSubmit={handlePaymentSubmit}
            onCancel={() => setShowPaymentForm(false)}
            isLoading={isSavingPayment}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Invoice info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Client
                </p>
                <p className="text-gray-900">{client?.name ?? invoice.client_id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Issue date
                </p>
                <p className="text-gray-900">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Due date
                </p>
                <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Last payment
                </p>
                <p className="text-gray-900">
                  {latestPayment ? formatDate(latestPayment.payment_date) : 'No payment yet'}
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
              Linked missions
            </h2>
            {relatedMissions.length > 0 ? (
              <div className="space-y-3">
                {relatedMissions.map((mission) => {
                  return (
                    <MissionListItem
                      key={mission.mission_id}
                      reference={mission.reference}
                      client={client?.name ?? mission.client_id}
                      route={`${mission.departure_location} → ${mission.arrival_location}`}
                      driver={mission.driver_name ?? 'No driver assigned'}
                      status={getMissionListStatus(mission.status)}
                      revenue={mission.revenue_amount}
                      onClick={() => navigate(`/missions/${mission.mission_id}`)}
                    />
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No missions are linked to this invoice.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Collection summary
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
                  style={{ width: `${Math.min(100, paymentProgress)}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Payments recorded</span>
                <span className="font-medium text-gray-900">{payments.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Collected</span>
                <span className="font-medium text-gray-900">
                  {formatCurrencyWithDecimals(invoice.amount_paid)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Outstanding</span>
                <span className="font-medium text-gray-900">
                  {formatCurrencyWithDecimals(amountRemaining)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Payments
            </h2>
            {paymentLoadError ? (
              <p className="text-sm text-red-700">{paymentLoadError}</p>
            ) : paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {paymentHistory.map((payment) => {
                  const methodConfig = getPaymentMethodConfig(
                    toPaymentMethod(payment.payment_method)
                  )

                  return (
                    <div
                      key={payment.payment_id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex text-xs font-medium px-2 py-0.5 rounded border ${methodConfig.color}`}
                            >
                              {methodConfig.label}
                            </span>
                            <p className="text-xs text-gray-500">
                              {formatDate(payment.payment_date)}
                            </p>
                          </div>
                          {payment.notes && (
                            <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>
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
              <p className="text-sm text-gray-500">No payments have been recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
