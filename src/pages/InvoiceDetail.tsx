import { useMemo, useState } from 'react'
import { ArrowLeft, FileDown, Mail, MapPin, PencilLine, Phone } from 'lucide-react'
import { createSearchParams, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { InvoiceEditorForm, type InvoiceEditorInput } from '../components/InvoiceEditorForm'
import { PageContainer } from '../components/PageContainer'
import {
  ModalSurface,
  PageLoadingSkeleton,
  SectionCard,
  StatePanel,
  StatCard,
  StatusBadge,
} from '../components/WorkspaceUi'
import { useClients, useInvoice, useMissions, usePaymentsByInvoice } from '../hooks'
import { calculateInvoicePaymentPercentage } from '../lib/calculations'
import {
  getClientStatusConfig,
  getPaymentMethodConfig,
} from '../lib/domain'
import { updateInvoiceRecord } from '../lib/api/invoices'
import { downloadInvoicePdf } from '../lib/export/invoicePdf'
import {
  getInvoiceBalance,
  getMissionMarginSnapshot,
  isInvoiceInCollectionQueue,
} from '../lib/operations'
import {
  appRoutes,
  getClientDetailRoute,
  getMissionDetailRoute,
} from '../lib/routes'
import {
  formatCurrencyWithDecimals,
  formatDate,
  formatDateTime,
  formatPercentage,
  formatPhoneNumber,
} from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'
import type { Client, Invoice, Mission } from '../types/domain'
import { PaymentMethod } from '../types'

function invoiceTone(status: Invoice['status']) {
  switch (status) {
    case 'partial':
      return 'warning' as const
    case 'overdue':
      return 'danger' as const
    case 'sent':
      return 'info' as const
    case 'paid':
      return 'success' as const
    default:
      return 'neutral' as const
  }
}

function missionTone(status: Mission['status']) {
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

function clientTone(status: Client['status']) {
  switch (status) {
    case 'active':
      return 'success' as const
    case 'inactive':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

const invoiceStatusLabels: Record<Invoice['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

const secondaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const primaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const inlineButtonClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

function getCollectionState(invoice: Invoice) {
  const outstanding = getInvoiceBalance(invoice)

  if (invoice.status === 'overdue' && outstanding > 0) {
    return {
      label: 'Immediate follow-up',
      tone: 'danger' as const,
      summary: 'This invoice is past due and should stay at the top of collection work.',
    }
  }

  if (invoice.status === 'partial' && outstanding > 0) {
    return {
      label: 'Partial collection',
      tone: 'warning' as const,
      summary: 'Cash has started to come in, but a remaining balance still requires follow-up.',
    }
  }

  if (isInvoiceInCollectionQueue(invoice)) {
    return {
      label: 'Collection queue',
      tone: 'warning' as const,
      summary: 'This invoice is issued and still has open balance to collect.',
    }
  }

  if (invoice.status === 'paid' || outstanding === 0) {
    return {
      label: 'Closed',
      tone: 'success' as const,
      summary: 'The invoice is fully settled and no collection work remains.',
    }
  }

  if (invoice.status === 'draft') {
    return {
      label: 'Draft',
      tone: 'neutral' as const,
      summary: 'The invoice has not entered collection yet and is still being prepared.',
    }
  }

  return {
    label: 'Issued',
    tone: 'info' as const,
    summary: 'The invoice is live and ready for collection tracking.',
  }
}

export function InvoiceDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { organization } = useWorkspaceState()
  const [showForm, setShowForm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const invoiceQuery = useInvoice(id)
  const paymentsQuery = usePaymentsByInvoice(id)
  const clientsQuery = useClients()
  const missionsQuery = useMissions()

  const invoice = invoiceQuery.data ?? null
  const payments = paymentsQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const missions = missionsQuery.data ?? []
  const isLoading =
    invoiceQuery.isLoading ||
    paymentsQuery.isLoading ||
    clientsQuery.isLoading ||
    missionsQuery.isLoading
  const error =
    (invoiceQuery.error instanceof Error && invoiceQuery.error.message) ||
    (clientsQuery.error instanceof Error && clientsQuery.error.message) ||
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    null
  const paymentLoadError =
    paymentsQuery.error instanceof Error ? paymentsQuery.error.message : null

  const client = useMemo(
    () => clients.find((item) => item.client_id === invoice?.client_id) ?? null,
    [clients, invoice?.client_id]
  )

  const linkedMissions = useMemo(
    () => {
      if (!invoice) {
        return []
      }

      return missions
        .filter((mission) => invoice.mission_ids.includes(mission.mission_id))
        .sort(
          (left, right) =>
            new Date(left.departure_datetime).getTime() -
            new Date(right.departure_datetime).getTime()
        )
    },
    [invoice?.mission_ids, missions]
  )

  const paymentHistory = useMemo(
    () =>
      [...payments].sort(
        (left, right) =>
          new Date(right.payment_date).getTime() - new Date(left.payment_date).getTime()
      ),
    [payments]
  )

  const latestPayment = paymentHistory[0] ?? null
  const clientStatusConfig = client ? getClientStatusConfig(client.status) : null

  const closeForm = () => {
    setShowForm(false)
    setActionError(null)
  }

  const handleSave = async (payload: InvoiceEditorInput) => {
    if (!invoice) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    try {
      await updateInvoiceRecord(invoice.invoice_id, payload)
      toast.success('Invoice updated.')
      closeForm()
      await Promise.all([
        invoiceQuery.refetch(),
        clientsQuery.refetch(),
        missionsQuery.refetch(),
      ])
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save the invoice.'
      setActionError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportPdf = async () => {
    if (!invoice) {
      return
    }

    setIsExportingPdf(true)

    try {
      await downloadInvoicePdf({
        invoice,
        client,
        linkedMissions,
        payments: paymentHistory,
        outstanding: getInvoiceBalance(invoice),
        organizationName: organization?.name,
        paymentSummaryNote: paymentLoadError,
      })
      toast.success('Invoice PDF downloaded.')
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : 'Unable to export the invoice PDF.'
      toast.error(message)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const openMission = (missionId: string) => {
    navigate(getMissionDetailRoute(missionId))
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageLoadingSkeleton stats={5} rows={3} />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <StatePanel
          tone="danger"
          title="Unable to load invoice"
          message={error}
          action={
            <button
              type="button"
              onClick={() => {
                void Promise.all([
                  invoiceQuery.refetch(),
                  paymentsQuery.refetch(),
                  clientsQuery.refetch(),
                  missionsQuery.refetch(),
                ])
              }}
              className={primaryButtonClasses}
            >
              Retry
            </button>
          }
        />
      </PageContainer>
    )
  }

  if (!invoice) {
    return (
      <PageContainer>
        <StatePanel
          title="Invoice not found"
          message="The requested invoice is not available in the current workspace."
          action={
            <button
              type="button"
              onClick={() => navigate(appRoutes.invoices)}
              className={secondaryButtonClasses}
            >
              Back to invoices
            </button>
          }
        />
      </PageContainer>
    )
  }

  const outstanding = getInvoiceBalance(invoice)
  const paidRatio = calculateInvoicePaymentPercentage(
    invoice.amount_total,
    invoice.amount_paid
  )
  const isOverdue = invoice.status === 'overdue'
  const collectionState = getCollectionState(invoice)
  const subtitle =
    invoice.status === 'paid' || outstanding === 0
      ? `Paid in full across ${linkedMissions.length} linked mission${
          linkedMissions.length === 1 ? '' : 's'
        }.`
      : isOverdue
        ? `${formatCurrencyWithDecimals(outstanding)} is overdue across ${
            linkedMissions.length
          } linked mission${linkedMissions.length === 1 ? '' : 's'}.`
        : `${formatCurrencyWithDecimals(outstanding)} remains open across ${
            linkedMissions.length
          } linked mission${linkedMissions.length === 1 ? '' : 's'}.`

  return (
    <PageContainer>
      {showForm ? (
        <ModalSurface
          title="Edit invoice"
          description="Update the current invoice while keeping client, mission links, dates, and billing state aligned."
          onClose={closeForm}
        >
          {actionError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
          <InvoiceEditorForm
            clients={clients}
            missions={missions}
            initialData={invoice}
            onSubmit={handleSave}
            onCancel={closeForm}
            isLoading={isSaving}
          />
        </ModalSurface>
      ) : null}

      <div className="space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(appRoutes.invoices)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to invoices
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-stone-950">
                {invoice.invoice_number}
              </h1>
              <StatusBadge
                label={invoiceStatusLabels[invoice.status]}
                tone={invoiceTone(invoice.status)}
              />
              <StatusBadge label={collectionState.label} tone={collectionState.tone} />
              {outstanding > 0 ? (
                <StatusBadge label="open balance" tone={isOverdue ? 'danger' : 'warning'} />
              ) : null}
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-500">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {client ? (
              <button
                type="button"
                onClick={() => navigate(getClientDetailRoute(client.client_id))}
                className={secondaryButtonClasses}
              >
                Open client
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                void handleExportPdf()
              }}
              disabled={isExportingPdf}
              className={secondaryButtonClasses}
            >
              <FileDown className="h-4 w-4" />
              {isExportingPdf ? 'Exporting…' : 'Export PDF'}
            </button>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={primaryButtonClasses}
            >
              <PencilLine className="h-4 w-4" />
              Edit invoice
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total amount"
            value={formatCurrencyWithDecimals(invoice.amount_total)}
            detail="Invoice value issued"
          />
          <StatCard
            label="Paid"
            value={formatCurrencyWithDecimals(invoice.amount_paid)}
            detail={`${paymentHistory.length} payment${paymentHistory.length === 1 ? '' : 's'} recorded`}
            tone="success"
          />
          <StatCard
            label="Outstanding"
            value={formatCurrencyWithDecimals(outstanding)}
            detail={outstanding > 0 ? 'Still in collection' : 'No open balance'}
            tone={isOverdue ? 'danger' : outstanding > 0 ? 'warning' : 'default'}
          />
          <StatCard
            label="Due date"
            value={isOverdue ? 'Overdue' : formatDate(invoice.due_date)}
            detail={isOverdue ? `Due ${formatDate(invoice.due_date)}` : 'Collection due date'}
            tone={isOverdue ? 'danger' : isInvoiceInCollectionQueue(invoice) ? 'warning' : 'default'}
          />
          <StatCard
            label="Linked missions"
            value={String(linkedMissions.length)}
            detail="Mission coverage on this invoice"
            tone={linkedMissions.length > 0 ? 'default' : 'warning'}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_320px]">
          <div className="space-y-5">
            <SectionCard>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Invoice summary
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    {collectionState.summary}
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    {client ? `${client.name}` : 'This client'} is billed for{' '}
                    {linkedMissions.length} linked mission
                    {linkedMissions.length === 1 ? '' : 's'} with{' '}
                    {formatCurrencyWithDecimals(outstanding)} remaining to collect.
                  </p>
                </div>

                <div
                  className={`
                    rounded-[1.2rem] border px-4 py-4
                    ${
                      isOverdue
                        ? 'border-rose-200 bg-rose-50/90'
                        : outstanding > 0
                          ? 'border-amber-200 bg-amber-50/90'
                          : 'border-emerald-200 bg-emerald-50/90'
                    }
                  `}
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Payment progress
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                    {formatPercentage(paidRatio, 0)}
                  </p>
                  <div className="mt-3 h-2 w-44 overflow-hidden rounded-full bg-white/80">
                    <div
                      className={
                        isOverdue
                          ? 'h-full rounded-full bg-rose-500'
                          : outstanding > 0
                            ? 'h-full rounded-full bg-amber-500'
                            : 'h-full rounded-full bg-emerald-500'
                      }
                      style={{ width: `${Math.min(100, Math.max(0, paidRatio))}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-stone-500">
                    {latestPayment
                      ? `Latest payment on ${formatDate(latestPayment.payment_date)}`
                      : 'No payment recorded yet'}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Linked missions
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Mission work covered by this invoice.
                  </p>
                </div>
                {linkedMissions.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        pathname: appRoutes.missions,
                        search: createSearchParams({ invoice: invoice.invoice_id }).toString(),
                      })
                    }
                    className={secondaryButtonClasses}
                  >
                    Open mission queue
                  </button>
                ) : null}
              </div>

              {linkedMissions.length === 0 ? (
                <div className="px-5 py-8">
                  <p className="text-sm font-medium text-stone-900">
                    No missions are linked to this invoice yet.
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    Edit the invoice to connect billing back to mission execution.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {linkedMissions.map((mission) => {
                    const margin = getMissionMarginSnapshot(mission)

                    return (
                      <article
                        key={mission.mission_id}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.15fr)_170px_190px] md:items-center"
                      >
                        <button
                          type="button"
                          onClick={() => openMission(mission.mission_id)}
                          className="min-w-0 rounded-[1rem] px-1 py-1 text-left transition hover:bg-stone-50"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-stone-950">
                              {mission.reference}
                            </h3>
                            <StatusBadge
                              label={mission.status.replace('_', ' ')}
                              tone={missionTone(mission.status)}
                            />
                          </div>
                          <p className="mt-2 text-sm font-medium text-stone-900">
                            {mission.departure_location} to {mission.arrival_location}
                          </p>
                          <p className="mt-1 text-sm text-stone-500">
                            {formatDateTime(mission.departure_datetime)}
                          </p>
                        </button>

                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Revenue
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {formatCurrencyWithDecimals(mission.revenue_amount)}
                          </p>
                          <p className="mt-1">
                            Margin {formatPercentage(margin.marginRatio * 100, 0)}
                          </p>
                        </div>

                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Cost basis
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {formatCurrencyWithDecimals(margin.baselineCost)}
                          </p>
                          <p className="mt-1">{margin.sourceLabel} cost source</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard className="overflow-hidden p-0">
              <div className="border-b border-stone-200 px-5 py-4">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                  Payment history
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Recorded cash movements attached to this invoice.
                </p>
              </div>

              {paymentLoadError ? (
                <div className="px-5 py-8">
                  <p className="text-sm font-medium text-rose-700">{paymentLoadError}</p>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="px-5 py-8">
                  <p className="text-sm font-medium text-stone-900">
                    No payments have been recorded yet.
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    The paid amount remains at {formatCurrencyWithDecimals(invoice.amount_paid)}.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {paymentHistory.map((payment) => {
                    const paymentMethodConfig = getPaymentMethodConfig(
                      payment.payment_method as PaymentMethod
                    )

                    return (
                      <article
                        key={payment.payment_id}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[170px_minmax(0,1fr)_140px] md:items-start"
                      >
                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Payment date
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {formatDate(payment.payment_date)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              label={paymentMethodConfig.label}
                              tone="info"
                            />
                            {payment.reference ? (
                              <span className="text-xs text-stone-500">
                                Ref {payment.reference}
                              </span>
                            ) : null}
                          </div>
                          {payment.notes ? (
                            <p className="mt-2 text-sm leading-7 text-stone-600">
                              {payment.notes}
                            </p>
                          ) : (
                            <p className="mt-2 text-sm text-stone-500">
                              Payment recorded without an additional note.
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Amount
                          </p>
                          <p className="mt-1 text-sm font-semibold text-stone-950">
                            {formatCurrencyWithDecimals(payment.amount)}
                          </p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <SectionCard>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                Client
              </h2>
              {client ? (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-stone-950">{client.name}</p>
                    {clientStatusConfig ? (
                      <StatusBadge
                        label={clientStatusConfig.label}
                        tone={clientTone(client.status)}
                      />
                    ) : null}
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-stone-500" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                        Email
                      </p>
                      <p className="mt-1 text-sm text-stone-900">
                        {client.email || 'No email on file'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-stone-500" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-stone-900">
                        {formatPhoneNumber(client.phone)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-stone-500" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                        Location
                      </p>
                      <p className="mt-1 text-sm text-stone-900">
                        {[client.city, client.country].filter(Boolean).join(', ') ||
                          'No location on file'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(getClientDetailRoute(client.client_id))}
                    className={secondaryButtonClasses}
                  >
                    Open client portfolio
                  </button>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-sm font-medium text-stone-900">
                    Client record unavailable.
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    The invoice still retains its client reference in the billing record.
                  </p>
                </div>
              )}
            </SectionCard>

            <SectionCard>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                Invoice metadata
              </h2>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Invoice status
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    {invoiceStatusLabels[invoice.status]}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Issue date
                  </p>
                  <p className="mt-1 text-sm text-stone-900">
                    {formatDate(invoice.issue_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Due date
                  </p>
                  <p
                    className={
                      isOverdue
                        ? 'mt-1 text-sm font-medium text-rose-700'
                        : 'mt-1 text-sm text-stone-900'
                    }
                  >
                    {formatDate(invoice.due_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Linked missions
                  </p>
                  <p className="mt-1 text-sm text-stone-900">
                    {linkedMissions.length}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Last payment
                  </p>
                  <p className="mt-1 text-sm text-stone-900">
                    {latestPayment ? formatDate(latestPayment.payment_date) : 'No payment yet'}
                  </p>
                </div>
                {invoice.notes ? (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Notes
                    </p>
                    <p className="mt-2 text-sm leading-7 text-stone-600">{invoice.notes}</p>
                  </div>
                ) : null}
              </div>
            </SectionCard>

            {linkedMissions.length > 0 ? (
              <SectionCard>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                  Mission shortcuts
                </h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {linkedMissions.slice(0, 6).map((mission) => (
                    <button
                      key={mission.mission_id}
                      type="button"
                      onClick={() => openMission(mission.mission_id)}
                      className={inlineButtonClasses}
                    >
                      {mission.reference}
                    </button>
                  ))}
                </div>
              </SectionCard>
            ) : null}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
