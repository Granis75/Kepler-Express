import { useMemo, useState } from 'react'
import { ArrowLeft, Mail, MapPin, PencilLine, Phone } from 'lucide-react'
import { createSearchParams, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { MissionEditorForm, type MissionEditorInput } from '../components/MissionEditorForm'
import { PageContainer } from '../components/PageContainer'
import {
  ModalSurface,
  PageLoadingSkeleton,
  SectionCard,
  StatePanel,
  StatCard,
  StatusBadge,
} from '../components/WorkspaceUi'
import { useClients, useExpenses, useInvoices, useMission } from '../hooks'
import { updateMissionRecord } from '../lib/api/missions'
import { getClientStatusConfig } from '../lib/domain'
import {
  getInvoiceBalance,
  getMissionMarginSnapshot,
  isMissionActive,
} from '../lib/operations'
import {
  appRoutes,
  getClientDetailRoute,
  getInvoiceDetailRoute,
} from '../lib/routes'
import {
  formatCurrencyWithDecimals,
  formatDate,
  formatDateTime,
  formatPercentage,
  formatPhoneNumber,
} from '../lib/utils'
import type { Client, Expense, Invoice, Mission } from '../types/domain'

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

function getApprovalTone(status: Expense['approval_status']) {
  switch (status) {
    case 'paid':
      return 'success' as const
    case 'approved':
      return 'info' as const
    case 'rejected':
      return 'danger' as const
    default:
      return 'warning' as const
  }
}

const missionStatusLabels: Record<Mission['status'], string> = {
  planned: 'Planned',
  assigned: 'Assigned',
  in_progress: 'In progress',
  delivered: 'Delivered',
  issue: 'Issue',
  cancelled: 'Cancelled',
}

const invoiceStatusLabels: Record<Invoice['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

const expenseTypeLabels: Record<Expense['expense_type'], string> = {
  fuel: 'Fuel',
  tolls: 'Tolls',
  mission: 'Mission',
  maintenance: 'Maintenance',
  other: 'Other',
}

const approvalStatusLabels: Record<Expense['approval_status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
}

const secondaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const primaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

export function MissionDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [showForm, setShowForm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const missionQuery = useMission(id)
  const clientsQuery = useClients()
  const invoicesQuery = useInvoices()
  const expensesQuery = useExpenses()

  const mission = missionQuery.data ?? null
  const clients = clientsQuery.data ?? []
  const invoices = invoicesQuery.data ?? []
  const expenses = expensesQuery.data ?? []
  const isLoading =
    missionQuery.isLoading ||
    clientsQuery.isLoading ||
    invoicesQuery.isLoading ||
    expensesQuery.isLoading
  const error =
    (missionQuery.error instanceof Error && missionQuery.error.message) ||
    (clientsQuery.error instanceof Error && clientsQuery.error.message) ||
    (invoicesQuery.error instanceof Error && invoicesQuery.error.message) ||
    (expensesQuery.error instanceof Error && expensesQuery.error.message) ||
    null

  const client = useMemo(
    () => clients.find((item) => item.client_id === mission?.client_id) ?? null,
    [clients, mission?.client_id]
  )

  const linkedInvoices = useMemo(
    () => {
      if (!mission) {
        return []
      }

      return invoices
        .filter((invoice) => invoice.mission_ids.includes(mission.mission_id))
        .sort((left, right) => {
          if (left.status === 'overdue' && right.status !== 'overdue') {
            return -1
          }

          if (left.status !== 'overdue' && right.status === 'overdue') {
            return 1
          }

          return new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
        })
    },
    [invoices, mission]
  )

  const linkedExpenses = useMemo(
    () => {
      if (!mission) {
        return []
      }

      return expenses
        .filter((expense) => expense.mission_id === mission.mission_id)
        .sort(
          (left, right) =>
            new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime()
        )
    },
    [expenses, mission]
  )

  const margin = mission ? getMissionMarginSnapshot(mission) : null
  const linkedExpenseTotal = linkedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const linkedInvoiceOutstanding = linkedInvoices.reduce(
    (sum, invoice) => sum + getInvoiceBalance(invoice),
    0
  )
  const primaryInvoice = linkedInvoices[0] ?? null
  const actualCostLogged = Number(mission?.actual_cost_amount ?? 0) > 0
  const clientStatusConfig = client ? getClientStatusConfig(client.status) : null

  const closeForm = () => {
    setShowForm(false)
    setActionError(null)
  }

  const handleSave = async (payload: MissionEditorInput) => {
    if (!mission) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    try {
      await updateMissionRecord(mission.mission_id, payload)
      toast.success('Mission updated.')
      closeForm()
      await Promise.all([
        missionQuery.refetch(),
        clientsQuery.refetch(),
        invoicesQuery.refetch(),
        expensesQuery.refetch(),
      ])
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save the mission.'
      setActionError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
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
          title="Unable to load mission"
          message={error}
          action={
            <button
              type="button"
              onClick={() => {
                void Promise.all([
                  missionQuery.refetch(),
                  clientsQuery.refetch(),
                  invoicesQuery.refetch(),
                  expensesQuery.refetch(),
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

  if (!mission || !margin) {
    return (
      <PageContainer>
        <StatePanel
          title="Mission not found"
          message="The requested mission is not available in the current workspace."
          action={
            <button
              type="button"
              onClick={() => navigate(appRoutes.missions)}
              className={secondaryButtonClasses}
            >
              Back to missions
            </button>
          }
        />
      </PageContainer>
    )
  }

  const subtitle = linkedInvoices.length === 0
    ? `Not invoiced yet${isMissionActive(mission.status) ? ' while still active' : ''}. Revenue is ${formatCurrencyWithDecimals(
        mission.revenue_amount
      )} against ${margin.sourceLabel.toLowerCase()} cost of ${formatCurrencyWithDecimals(
        margin.baselineCost
      )}.`
    : margin.isSensitive
      ? `Margin is currently sensitive at ${formatPercentage(
          margin.marginRatio * 100,
          0
        )} with ${linkedInvoices.length} linked invoice${
          linkedInvoices.length === 1 ? '' : 's'
        }.`
      : `${linkedInvoices.length} linked invoice${
          linkedInvoices.length === 1 ? '' : 's'
        } and ${linkedExpenses.length} linked expense${
          linkedExpenses.length === 1 ? '' : 's'
        } keep this mission financially visible.`

  const assignmentSummary = mission.driver_name || mission.vehicle_name
    ? `${mission.driver_name || 'Driver unassigned'} • ${mission.vehicle_name || 'Vehicle not set'}`
    : 'No driver or vehicle assigned yet.'

  return (
    <PageContainer>
      {showForm ? (
        <ModalSurface
          title="Edit mission"
          description="Update the current mission while keeping route, assignment, schedule, and margin inputs aligned."
          onClose={closeForm}
        >
          {actionError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
          <MissionEditorForm
            clients={clients}
            initialData={mission}
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
              onClick={() => navigate(appRoutes.missions)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to missions
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-stone-950">
                {mission.reference}
              </h1>
              <StatusBadge
                label={missionStatusLabels[mission.status]}
                tone={missionTone(mission.status)}
              />
              {linkedInvoices.length === 0 ? (
                <StatusBadge label="not invoiced" tone="warning" />
              ) : null}
              {margin.isSensitive ? (
                <StatusBadge label="margin sensitive" tone="danger" />
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

            {primaryInvoice ? (
              <button
                type="button"
                onClick={() => navigate(getInvoiceDetailRoute(primaryInvoice.invoice_id))}
                className={secondaryButtonClasses}
              >
                Open linked invoice
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={primaryButtonClasses}
            >
              <PencilLine className="h-4 w-4" />
              Edit mission
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Revenue"
            value={formatCurrencyWithDecimals(mission.revenue_amount)}
            detail="Booked mission revenue"
          />
          <StatCard
            label="Estimated cost"
            value={formatCurrencyWithDecimals(mission.estimated_cost_amount)}
            detail="Planned operating cost"
          />
          <StatCard
            label="Actual cost"
            value={
              actualCostLogged
                ? formatCurrencyWithDecimals(mission.actual_cost_amount)
                : 'Pending'
            }
            detail={
              actualCostLogged
                ? 'Recorded actual operating cost'
                : 'Actual cost not logged yet'
            }
            tone={actualCostLogged ? 'default' : 'warning'}
          />
          <StatCard
            label="Margin"
            value={formatCurrencyWithDecimals(margin.marginAmount)}
            detail={`${formatPercentage(margin.marginRatio * 100, 0)} on ${margin.sourceLabel.toLowerCase()} cost`}
            tone={margin.isSensitive ? 'danger' : 'success'}
          />
          <StatCard
            label="Invoice linkage"
            value={linkedInvoices.length === 0 ? 'Unbilled' : String(linkedInvoices.length)}
            detail={
              linkedInvoices.length === 0
                ? 'Create invoice context'
                : `${formatCurrencyWithDecimals(linkedInvoiceOutstanding)} outstanding`
            }
            tone={
              linkedInvoices.length === 0
                ? 'warning'
                : linkedInvoiceOutstanding > 0
                  ? 'danger'
                  : 'default'
            }
            onClick={() =>
              linkedInvoices.length > 0
                ? primaryInvoice
                  ? navigate(getInvoiceDetailRoute(primaryInvoice.invoice_id))
                  : undefined
                : navigate({
                    pathname: appRoutes.invoices,
                    search: createSearchParams({
                      mission: mission.mission_id,
                      compose: 'new',
                    }).toString(),
                  })
            }
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_320px]">
          <div className="space-y-5">
            <SectionCard>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Mission summary
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    {client ? `${client.name}` : 'This mission'} is moving from{' '}
                    {mission.departure_location} to {mission.arrival_location} with{' '}
                    {formatCurrencyWithDecimals(mission.revenue_amount)} in revenue and{' '}
                    {formatCurrencyWithDecimals(margin.baselineCost)} as the current cost basis.
                  </p>
                </div>
                <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
                  {missionStatusLabels[mission.status]}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Route</p>
                  <p className="mt-2 text-sm font-medium text-stone-900">
                    {mission.departure_location} to {mission.arrival_location}
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    Departure {formatDateTime(mission.departure_datetime)}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Arrival{' '}
                    {mission.arrival_datetime
                      ? formatDateTime(mission.arrival_datetime)
                      : 'not set'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Operational state
                  </p>
                  <p className="mt-2 text-sm font-medium text-stone-900">
                    {isMissionActive(mission.status)
                      ? 'Mission is active in the live queue.'
                      : mission.status === 'delivered'
                        ? 'Mission has been delivered.'
                        : mission.status === 'issue'
                          ? 'Mission requires operational follow-up.'
                          : 'Mission is no longer active.'}
                  </p>
                  <p className="mt-2 text-sm text-stone-500">{assignmentSummary}</p>
                  <p className="mt-2 text-sm text-stone-500">
                    {linkedExpenses.length} linked expense
                    {linkedExpenses.length === 1 ? '' : 's'} totaling{' '}
                    {formatCurrencyWithDecimals(linkedExpenseTotal)}.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Linked expenses
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Direct expense trail recorded against this mission.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      pathname: appRoutes.expenses,
                      search: createSearchParams({ mission: mission.mission_id }).toString(),
                    })
                  }
                  className={secondaryButtonClasses}
                >
                  Open expenses
                </button>
              </div>

              {linkedExpenses.length === 0 ? (
                <div className="px-5 py-8">
                  <p className="text-sm font-medium text-stone-900">
                    No expenses are linked to this mission yet.
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    The cost view is currently based on mission-level estimated or actual cost only.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {linkedExpenses.map((expense) => (
                    <article
                      key={expense.expense_id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[170px_minmax(0,1fr)_140px] md:items-start"
                    >
                      <div className="text-sm text-stone-500">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                          Date
                        </p>
                        <p className="mt-1 font-medium text-stone-900">
                          {formatDate(expense.expense_date)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {expense.advanced_by_driver ? 'Advanced by driver' : 'Company paid'}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={expenseTypeLabels[expense.expense_type]}
                            tone="neutral"
                          />
                          <StatusBadge
                            label={approvalStatusLabels[expense.approval_status]}
                            tone={getApprovalTone(expense.approval_status)}
                          />
                          {!expense.receipt_present ? (
                            <StatusBadge label="receipt missing" tone="danger" />
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm font-medium text-stone-900">
                          {expense.driver_name || 'No driver context'} •{' '}
                          {expense.vehicle_name || 'No vehicle context'}
                        </p>
                        {expense.notes ? (
                          <p className="mt-2 text-sm leading-7 text-stone-600">
                            {expense.notes}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-stone-500">
                            No additional note recorded for this expense.
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                          Amount
                        </p>
                        <p className="mt-1 text-sm font-semibold text-stone-950">
                          {formatCurrencyWithDecimals(expense.amount)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Linked invoices
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Billing objects tied back to this mission.
                  </p>
                </div>
                {linkedInvoices.length === 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        pathname: appRoutes.invoices,
                        search: createSearchParams({
                          mission: mission.mission_id,
                          compose: 'new',
                        }).toString(),
                      })
                    }
                    className={primaryButtonClasses}
                  >
                    Create invoice
                  </button>
                ) : null}
              </div>

              {linkedInvoices.length === 0 ? (
                <div className="px-5 py-8">
                  <p className="text-sm font-medium text-stone-900">
                    This mission has not been invoiced yet.
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    Open invoice creation with this mission pre-linked to keep billing aligned.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {linkedInvoices.map((invoice) => {
                    const outstanding = getInvoiceBalance(invoice)

                    return (
                      <button
                        key={invoice.invoice_id}
                        type="button"
                        onClick={() => navigate(getInvoiceDetailRoute(invoice.invoice_id))}
                        className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-stone-50 md:grid-cols-[minmax(0,1fr)_170px_150px] md:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-stone-950">
                              {invoice.invoice_number}
                            </h3>
                            <StatusBadge
                              label={invoiceStatusLabels[invoice.status]}
                              tone={invoiceTone(invoice.status)}
                            />
                            {outstanding > 0 ? (
                              <StatusBadge
                                label="open balance"
                                tone={invoice.status === 'overdue' ? 'danger' : 'warning'}
                              />
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-stone-500">
                            Due {formatDate(invoice.due_date)} • Issued {formatDate(invoice.issue_date)}
                          </p>
                        </div>

                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Total
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {formatCurrencyWithDecimals(invoice.amount_total)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Outstanding
                          </p>
                          <p
                            className={
                              invoice.status === 'overdue'
                                ? 'mt-1 text-sm font-semibold text-rose-700'
                                : outstanding > 0
                                  ? 'mt-1 text-sm font-semibold text-amber-800'
                                  : 'mt-1 text-sm font-semibold text-stone-900'
                            }
                          >
                            {formatCurrencyWithDecimals(outstanding)}
                          </p>
                        </div>
                      </button>
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
                    The mission still retains its client reference in the operational record.
                  </p>
                </div>
              )}
            </SectionCard>

            <SectionCard>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                Assignment
              </h2>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Driver</p>
                  <p className="mt-1 text-sm text-stone-900">
                    {mission.driver_name || 'No driver assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Vehicle</p>
                  <p className="mt-1 text-sm text-stone-900">
                    {mission.vehicle_name || 'No vehicle assigned'}
                  </p>
                </div>
                {!mission.driver_name && !mission.vehicle_name ? (
                  <p className="text-sm text-stone-500">
                    Assignment is still open for operations planning.
                  </p>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                Mission metadata
              </h2>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Departure
                  </p>
                  <p className="mt-1 text-sm text-stone-900">
                    {formatDateTime(mission.departure_datetime)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Arrival
                  </p>
                  <p className="mt-1 text-sm text-stone-900">
                    {mission.arrival_datetime
                      ? formatDateTime(mission.arrival_datetime)
                      : 'Arrival not set'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Status</p>
                  <p className="mt-1 text-sm text-stone-900">
                    {missionStatusLabels[mission.status]}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Route</p>
                  <p className="mt-1 text-sm text-stone-900">
                    {mission.departure_location} to {mission.arrival_location}
                  </p>
                </div>
                {mission.notes ? (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Notes
                    </p>
                    <p className="mt-2 text-sm leading-7 text-stone-600">{mission.notes}</p>
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
