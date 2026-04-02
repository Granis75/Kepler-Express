import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Link2, Plus, Search } from 'lucide-react'
import clsx from 'clsx'
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { InvoiceEditorForm, type InvoiceEditorInput } from '../components/InvoiceEditorForm'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import {
  ActiveFilterBar,
  ModalSurface,
  PageLoadingSkeleton,
  SectionCard,
  StatePanel,
  StatCard,
  StatusBadge,
} from '../components/WorkspaceUi'
import { createInvoiceRecord, updateInvoiceRecord } from '../lib/api/invoices'
import {
  getInvoiceBalance,
  isInvoiceInCollectionQueue,
  mergeSearchParams,
} from '../lib/operations'
import { appRoutes } from '../lib/routes'
import {
  formatCurrencyWithDecimals,
  formatDate,
  toSearchValue,
  truncateString,
} from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'
import { useClients, useInvoices, useMissions } from '../hooks'
import type { Invoice } from '../types/domain'

function invoiceTone(status: Invoice['status']) {
  switch (status) {
    case 'paid':
      return 'success' as const
    case 'partial':
      return 'warning' as const
    case 'overdue':
      return 'danger' as const
    case 'sent':
      return 'info' as const
    default:
      return 'neutral' as const
  }
}

function isEditableInvoice(status: Invoice['status']) {
  return status === 'draft' || status === 'sent'
}

const invoiceStatusLabels: Record<Invoice['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

const invoiceQueueOptions = [
  { value: 'all', label: 'All invoices' },
  { value: 'unpaid', label: 'Collection queue' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'partial', label: 'Partial' },
  { value: 'draft', label: 'Drafts' },
  { value: 'paid', label: 'Paid' },
] as const

const inlineLinkButtonClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50'

const secondaryActionButtonClasses =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50'

export function Invoices() {
  const navigate = useNavigate()
  const { organization } = useWorkspaceState()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const invoicesQuery = useInvoices()
  const clientsQuery = useClients()
  const missionsQuery = useMissions()

  const invoices = invoicesQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const missions = missionsQuery.data ?? []
  const isLoading =
    invoicesQuery.isLoading || clientsQuery.isLoading || missionsQuery.isLoading
  const error =
    (invoicesQuery.error instanceof Error && invoicesQuery.error.message) ||
    (clientsQuery.error instanceof Error && clientsQuery.error.message) ||
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    null

  const queue = searchParams.get('queue') ?? 'all'
  const searchQuery = searchParams.get('q') ?? ''
  const statusFilter = (searchParams.get('status') ?? '') as Invoice['status'] | ''
  const clientFilter = searchParams.get('client') ?? ''
  const missionFilter = searchParams.get('mission') ?? ''
  const focusInvoiceId = searchParams.get('focus') ?? ''
  const composeIntent = searchParams.get('compose') ?? ''

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.client_id, client.name] as const)),
    [clients]
  )

  const missionReferenceById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission.reference] as const)),
    [missions]
  )

  const missionById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission] as const)),
    [missions]
  )

  const invoiceById = useMemo(
    () => new Map(invoices.map((invoice) => [invoice.invoice_id, invoice] as const)),
    [invoices]
  )

  const summary = useMemo(
    () => ({
      outstanding: invoices.reduce((sum, invoice) => sum + getInvoiceBalance(invoice), 0),
      collected: invoices.reduce((sum, invoice) => sum + Number(invoice.amount_paid ?? 0), 0),
      overdue: invoices.filter((invoice) => invoice.status === 'overdue').length,
      collectionQueue: invoices.filter((invoice) => isInvoiceInCollectionQueue(invoice)).length,
    }),
    [invoices]
  )

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return [...invoices]
      .filter((invoice) => {
        const missionSummary = invoice.mission_ids
          .map((missionId) => missionReferenceById.get(missionId))
          .filter(Boolean)
          .join(' ')

        const matchesSearch =
          !query ||
          toSearchValue(invoice.invoice_number).includes(query) ||
          toSearchValue(clientNameById.get(invoice.client_id)).includes(query) ||
          toSearchValue(missionSummary).includes(query)

        const matchesStatus = !statusFilter || invoice.status === statusFilter
        const matchesClient = !clientFilter || invoice.client_id === clientFilter
        const matchesMission = !missionFilter || invoice.mission_ids.includes(missionFilter)

        const matchesQueue =
          queue === 'all'
            ? true
            : queue === 'unpaid'
              ? isInvoiceInCollectionQueue(invoice)
              : queue === 'overdue'
                ? invoice.status === 'overdue'
                : queue === 'partial'
                  ? invoice.status === 'partial'
                  : queue === 'draft'
                    ? invoice.status === 'draft'
                    : invoice.status === 'paid'

        return matchesSearch && matchesStatus && matchesClient && matchesMission && matchesQueue
      })
      .sort((left, right) => {
        if (left.invoice_id === focusInvoiceId) {
          return -1
        }

        if (right.invoice_id === focusInvoiceId) {
          return 1
        }

        if (isInvoiceInCollectionQueue(left) && !isInvoiceInCollectionQueue(right)) {
          return -1
        }

        if (!isInvoiceInCollectionQueue(left) && isInvoiceInCollectionQueue(right)) {
          return 1
        }

        return new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
      })
  }, [
    clientFilter,
    clientNameById,
    focusInvoiceId,
    invoices,
    missionFilter,
    missionReferenceById,
    queue,
    searchQuery,
    statusFilter,
  ])

  const closeForm = () => {
    setShowForm(false)
    setSelectedInvoice(null)
    setActionError(null)
  }

  const updateFilters = (updates: Record<string, string | null>) => {
    setSearchParams(mergeSearchParams(searchParams, { ...updates, focus: null }), {
      replace: true,
    })
  }

  const clearFocus = () => {
    setSearchParams(mergeSearchParams(searchParams, { focus: null }), {
      replace: true,
    })
  }

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const openCreate = () => {
    if (clients.length === 0) {
      toast('Create a client first to prepare invoice billing.')
      navigate(appRoutes.clients)
      return
    }

    if (missions.length === 0) {
      toast('Create a mission first to link invoice lines to real work.')
      navigate(appRoutes.missions)
      return
    }

    setSelectedInvoice(null)
    setActionError(null)
    setShowForm(true)
  }

  const handleSave = async (payload: InvoiceEditorInput) => {
    if (!organization) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    try {
      if (selectedInvoice) {
        await updateInvoiceRecord(selectedInvoice.invoice_id, payload)
      } else {
        await createInvoiceRecord(organization.organization_id, payload)
      }

      toast.success(selectedInvoice ? 'Invoice updated.' : 'Invoice created.')
      closeForm()
      await Promise.all([
        invoicesQuery.refetch(),
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

  const filteredMission = missionFilter ? missionById.get(missionFilter) : null
  const focusedInvoice = focusInvoiceId ? invoiceById.get(focusInvoiceId) : null
  const queueLabel =
    invoiceQueueOptions.find((option) => option.value === queue)?.label ?? 'All invoices'

  const draftInvoiceValues = filteredMission
    ? {
        client_id: filteredMission.client_id,
        mission_ids: [filteredMission.mission_id],
        amount_total: filteredMission.revenue_amount,
      }
    : undefined

  useEffect(() => {
    if (composeIntent !== 'new' || showForm || selectedInvoice || isLoading) {
      return
    }

    if (clients.length === 0 || missions.length === 0) {
      return
    }

    setSelectedInvoice(null)
    setActionError(null)
    setShowForm(true)
    setSearchParams(mergeSearchParams(searchParams, { compose: null }), {
      replace: true,
    })
  }, [
    clients.length,
    composeIntent,
    isLoading,
    missions.length,
    searchParams,
    selectedInvoice,
    setSearchParams,
    showForm,
  ])

  const activeFilterItems = [
    queue !== 'all'
      ? {
          id: 'queue',
          label: 'Queue',
          value: queueLabel,
          onClear: () => updateFilters({ queue: null }),
        }
      : null,
    clientFilter
      ? {
          id: 'client',
          label: 'Client',
          value: clientNameById.get(clientFilter) ?? 'Unknown client',
          onClear: () => updateFilters({ client: null }),
        }
      : null,
    statusFilter
      ? {
          id: 'status',
          label: 'Status',
          value: invoiceStatusLabels[statusFilter] ?? statusFilter,
          onClear: () => updateFilters({ status: null }),
        }
      : null,
    filteredMission
      ? {
          id: 'mission',
          label: 'Mission',
          value: filteredMission.reference,
          onClear: () => updateFilters({ mission: null }),
        }
      : null,
    focusedInvoice
      ? {
          id: 'invoice',
          label: 'Invoice',
          value: focusedInvoice.invoice_number,
          onClear: clearFocus,
        }
      : null,
    searchQuery
      ? {
          id: 'search',
          label: 'Search',
          value: truncateString(searchQuery, 28),
          onClear: () => updateFilters({ q: null }),
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string
    label: string
    value: string
    onClear: () => void
  }>

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description={`Collection workflow and billing visibility for ${organization?.name ?? 'the current workspace'}, with linked mission context exposed inline.`}
        actions={
          <button
            type="button"
            onClick={openCreate}
            disabled={clients.length === 0 || missions.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New invoice
          </button>
        }
      />

      {showForm ? (
        <ModalSurface
          title={selectedInvoice ? 'Edit invoice' : 'Create invoice'}
          description="Keep invoice creation aligned with the current schema: client, mission set, amount, dates, and workflow status."
          onClose={closeForm}
        >
          {actionError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
          <InvoiceEditorForm
            key={selectedInvoice?.invoice_id ?? `draft-${filteredMission?.mission_id ?? 'default'}`}
            clients={clients}
            missions={missions}
            initialData={selectedInvoice ?? undefined}
            initialValues={selectedInvoice ? undefined : draftInvoiceValues}
            onSubmit={handleSave}
            onCancel={closeForm}
            isLoading={isSaving}
          />
        </ModalSurface>
      ) : null}

      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Outstanding"
            value={formatCurrencyWithDecimals(summary.outstanding)}
            detail="All open invoice balances"
            tone={summary.overdue > 0 ? 'danger' : 'warning'}
            onClick={() => updateFilters({ queue: 'unpaid' })}
          />
          <StatCard
            label="Collected"
            value={formatCurrencyWithDecimals(summary.collected)}
            detail="Cash recorded against invoices"
            tone="success"
            onClick={resetFilters}
          />
          <StatCard
            label="Overdue invoices"
            value={String(summary.overdue)}
            detail="Past the agreed due date"
            tone={summary.overdue > 0 ? 'danger' : 'default'}
            onClick={() => updateFilters({ queue: 'overdue' })}
          />
          <StatCard
            label="Collection queue"
            value={String(summary.collectionQueue)}
            detail="Sent, partial, or overdue invoices"
            tone={summary.collectionQueue > 0 ? 'warning' : 'default'}
            onClick={() => updateFilters({ queue: 'unpaid' })}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
          <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <SectionCard>
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                  Filters
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Keep billing queues visible by client, mission, and collection state.
                </p>
              </div>

              <label className="relative mt-5 block">
                <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => updateFilters({ q: event.target.value || null })}
                  placeholder="Search invoice, client, or mission"
                  className="input-shell pl-11"
                />
              </label>

              <div className="mt-5 space-y-2">
                {invoiceQueueOptions.map((option) => {
                  const count =
                    option.value === 'unpaid'
                      ? summary.collectionQueue
                      : option.value === 'overdue'
                        ? summary.overdue
                        : option.value === 'partial'
                          ? invoices.filter((invoice) => invoice.status === 'partial').length
                          : option.value === 'draft'
                            ? invoices.filter((invoice) => invoice.status === 'draft').length
                            : option.value === 'paid'
                              ? invoices.filter((invoice) => invoice.status === 'paid').length
                              : invoices.length

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateFilters({ queue: option.value === 'all' ? null : option.value })
                      }
                      className={clsx(
                        'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition',
                        queue === option.value || (!queue && option.value === 'all')
                          ? 'border-stone-950 bg-stone-950 text-white shadow-[0_10px_22px_rgba(28,25,23,0.16)]'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                      )}
                    >
                      <span>{option.label}</span>
                      <span>{count}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 space-y-4">
                <select
                  value={clientFilter}
                  onChange={(event) => updateFilters({ client: event.target.value || null })}
                  className="input-shell"
                >
                  <option value="">All clients</option>
                  {clients.map((client) => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    updateFilters({
                      status: (event.target.value || null) as Invoice['status'] | null,
                    })
                  }
                  className="input-shell"
                >
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <button type="button" onClick={resetFilters} className="btn-secondary mt-5 w-full">
                Reset filters
              </button>
            </SectionCard>
          </div>

          <div className="space-y-3">
            <ActiveFilterBar items={activeFilterItems} onClearAll={resetFilters} />

            {isLoading ? (
              <PageLoadingSkeleton stats={4} rows={4} />
            ) : error ? (
              <StatePanel
                tone="danger"
                title="Unable to load invoices"
                message={error}
                action={
                  <button
                    type="button"
                    onClick={() => {
                      void Promise.all([
                        invoicesQuery.refetch(),
                        clientsQuery.refetch(),
                        missionsQuery.refetch(),
                      ])
                    }}
                    className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                  >
                    Retry
                  </button>
                }
              />
            ) : filteredInvoices.length === 0 ? (
              <StatePanel
                title={invoices.length === 0 ? 'No invoices yet' : 'No matching invoices'}
                message={
                  invoices.length === 0
                    ? clients.length === 0 || missions.length === 0
                      ? 'Create clients and missions first so invoice creation has real billing context.'
                      : 'Create the first invoice to start tracking cash collection.'
                    : 'Adjust the queue or filters to surface another billing record.'
                }
                action={
                  invoices.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (clients.length === 0) {
                          navigate(appRoutes.clients)
                          return
                        }

                        if (missions.length === 0) {
                          navigate(appRoutes.missions)
                          return
                        }

                        openCreate()
                      }}
                      className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                    >
                      {clients.length === 0
                        ? 'Open clients'
                        : missions.length === 0
                          ? 'Open missions'
                          : 'Create invoice'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                    >
                      Reset filters
                    </button>
                  )
                }
              />
            ) : (
              <SectionCard className="overflow-hidden p-0">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-4 py-3">
                  <div>
                    <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                      Invoice queue
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Showing {filteredInvoices.length} of {invoices.length} invoice
                      {filteredInvoices.length === 1 ? '' : 's'}.
                    </p>
                  </div>
                  <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
                    {queueLabel}
                  </div>
                </div>

                <div className="hidden border-b border-stone-200 bg-stone-50/70 px-4 py-2 md:grid md:grid-cols-[minmax(0,1.2fr)_145px_170px_235px_145px] md:gap-3">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    Invoice
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    Dates
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    Amounts
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    Linked missions
                  </span>
                  <span className="text-right text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    Actions
                  </span>
                </div>

                <div className="divide-y divide-stone-200">
                  {filteredInvoices.map((invoice) => {
                    const visibleMissionIds = invoice.mission_ids.slice(0, 2)
                    const remainingMissionCount =
                      invoice.mission_ids.length - visibleMissionIds.length
                    const firstMissionId = invoice.mission_ids[0]

                    return (
                      <article
                        key={invoice.invoice_id}
                        className={clsx(
                          'grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.2fr)_145px_170px_235px_145px] md:items-center',
                          focusInvoiceId === invoice.invoice_id && 'bg-amber-50/40'
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-semibold text-stone-950">
                              {invoice.invoice_number}
                            </h2>
                            <StatusBadge label={invoice.status} tone={invoiceTone(invoice.status)} />
                            {getInvoiceBalance(invoice) > 0 ? (
                              <StatusBadge label="open balance" tone="warning" />
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-stone-900">
                            {clientNameById.get(invoice.client_id) ?? 'Unknown client'}
                          </p>
                          {invoice.notes ? (
                            <p className="mt-1.5 line-clamp-1 text-sm text-stone-500">
                              {invoice.notes}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-sm text-stone-500">
                          <p className="font-medium text-stone-900">
                            {formatDate(invoice.issue_date)}
                          </p>
                          <p className="mt-1 text-stone-500">Due {formatDate(invoice.due_date)}</p>
                        </div>

                        <div className="text-sm text-stone-500">
                          <p className="font-medium text-stone-900 tabular-nums">
                            {formatCurrencyWithDecimals(invoice.amount_total)}
                          </p>
                          <p className="mt-1">Paid {formatCurrencyWithDecimals(invoice.amount_paid)}</p>
                          <p className="mt-1">
                            Outstanding {formatCurrencyWithDecimals(getInvoiceBalance(invoice))}
                          </p>
                        </div>

                        <div className="text-sm text-stone-500">
                          {invoice.mission_ids.length > 0 ? (
                            <>
                              <p className="font-medium text-stone-900">
                                {invoice.mission_ids.length} linked mission
                                {invoice.mission_ids.length === 1 ? '' : 's'}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {visibleMissionIds.map((missionId) => (
                                  <button
                                    key={missionId}
                                    type="button"
                                    onClick={() =>
                                      navigate({
                                        pathname: appRoutes.missions,
                                        search: createSearchParams({
                                          invoice: invoice.invoice_id,
                                          focus: missionId,
                                        }).toString(),
                                      })
                                    }
                                    className={inlineLinkButtonClasses}
                                  >
                                    <Link2 className="h-3 w-3" />
                                    <span>
                                      {missionReferenceById.get(missionId) ?? 'Unknown mission'}
                                    </span>
                                  </button>
                                ))}
                                {remainingMissionCount > 0 ? (
                                  <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-500">
                                    +{remainingMissionCount} more
                                  </span>
                                ) : null}
                              </div>
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-stone-500">No linked missions</p>
                          )}
                        </div>

                        <div className="flex flex-col items-stretch gap-2 md:items-end">
                          {firstMissionId ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate({
                                  pathname: appRoutes.missions,
                                  search: createSearchParams({
                                    invoice: invoice.invoice_id,
                                    focus: firstMissionId,
                                  }).toString(),
                                })
                              }
                              className={secondaryActionButtonClasses}
                            >
                              <span>
                                {invoice.mission_ids.length === 1 ? 'Open mission' : 'Open missions'}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          ) : null}

                          {isEditableInvoice(invoice.status) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setActionError(null)
                                setShowForm(true)
                              }}
                              className={secondaryActionButtonClasses}
                            >
                              Edit
                            </button>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
