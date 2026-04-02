import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { InvoiceEditorForm, type InvoiceEditorInput } from '../components/InvoiceEditorForm'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import {
  ModalSurface,
  PageLoadingSkeleton,
  SectionCard,
  StatePanel,
  StatCard,
  StatusBadge,
} from '../components/WorkspaceUi'
import { createInvoiceRecord, updateInvoiceRecord } from '../lib/api/invoices'
import { appRoutes } from '../lib/routes'
import { formatCurrencyWithDecimals, formatDate, toSearchValue } from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'
import { useClients, useInvoices, useMissions } from '../hooks'
import type { Invoice } from '../types/domain'

function toSafeNumber(value: number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function remainingAmount(invoice: Invoice) {
  return Math.max(0, toSafeNumber(invoice.amount_total) - toSafeNumber(invoice.amount_paid))
}

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

export function Invoices() {
  const navigate = useNavigate()
  const { organization } = useWorkspaceState()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | ''>('')
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

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.client_id, client.name] as const)),
    [clients]
  )

  const missionReferenceById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission.reference] as const)),
    [missions]
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

        return matchesSearch && matchesStatus
      })
      .sort((left, right) => right.invoice_number.localeCompare(left.invoice_number))
  }, [clientNameById, invoices, missionReferenceById, searchQuery, statusFilter])

  const summary = useMemo(
    () => ({
      outstanding: invoices.reduce((sum, invoice) => sum + remainingAmount(invoice), 0),
      collected: invoices.reduce((sum, invoice) => sum + toSafeNumber(invoice.amount_paid), 0),
      overdue: invoices.filter((invoice) => invoice.status === 'overdue').length,
      drafts: invoices.filter((invoice) => invoice.status === 'draft').length,
    }),
    [invoices]
  )

  const closeForm = () => {
    setShowForm(false)
    setSelectedInvoice(null)
    setActionError(null)
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

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description={`Billing, cash collection, and follow-up visibility for ${organization?.name ?? 'the current workspace'}.`}
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
            clients={clients}
            missions={missions}
            initialData={selectedInvoice ?? undefined}
            onSubmit={handleSave}
            onCancel={closeForm}
            isLoading={isSaving}
          />
        </ModalSurface>
      ) : null}

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Outstanding"
            value={formatCurrencyWithDecimals(summary.outstanding)}
            tone={summary.overdue > 0 ? 'danger' : 'warning'}
          />
          <StatCard
            label="Collected"
            value={formatCurrencyWithDecimals(summary.collected)}
            tone="success"
          />
          <StatCard label="Overdue invoices" value={String(summary.overdue)} tone="danger" />
          <StatCard label="Drafts" value={String(summary.drafts)} />
        </div>

        <SectionCard>
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by invoice number, client, or mission"
                className="w-full rounded-2xl border border-stone-300 bg-white px-11 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter((event.target.value || '') as Invoice['status'] | '')}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </SectionCard>

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
                  : 'Create the first invoice to start tracking outstanding cash.'
                : 'Adjust the filters to surface another billing record.'
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
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('')
                  }}
                  className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                >
                  Reset filters
                </button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredInvoices.map((invoice) => {
              const missionSummary = invoice.mission_ids
                .map((missionId) => missionReferenceById.get(missionId))
                .filter(Boolean)
                .join(', ')

              return (
                <SectionCard key={invoice.invoice_id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                          {invoice.invoice_number}
                        </h2>
                        <StatusBadge label={invoice.status} tone={invoiceTone(invoice.status)} />
                      </div>
                      <p className="mt-2 text-sm text-stone-500">
                        {clientNameById.get(invoice.client_id) ?? 'Unknown client'}
                      </p>
                    </div>

                    {isEditableInvoice(invoice.status) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setActionError(null)
                          setShowForm(true)
                        }}
                        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Outstanding</p>
                      <p className="mt-2 text-sm font-medium text-stone-900">
                        {formatCurrencyWithDecimals(remainingAmount(invoice))}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Collected</p>
                      <p className="mt-2 text-sm font-medium text-stone-900">
                        {formatCurrencyWithDecimals(invoice.amount_paid)}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Issue date</p>
                      <p className="mt-2 text-sm font-medium text-stone-900">
                        {formatDate(invoice.issue_date)}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Due date</p>
                      <p className="mt-2 text-sm font-medium text-stone-900">
                        {formatDate(invoice.due_date)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Linked missions</p>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
                      {missionSummary || 'No mission references available'}
                    </p>
                  </div>

                  {invoice.notes ? (
                    <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Notes</p>
                      <p className="mt-2 text-sm leading-7 text-stone-600">{invoice.notes}</p>
                    </div>
                  ) : null}
                </SectionCard>
              )
            })}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
