import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import clsx from 'clsx'
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ClientForm } from '../components/ClientForm'
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
import { useClients, useInvoices, useMissions } from '../hooks'
import { getClientStatusConfig } from '../lib/domain'
import { createClient, updateClient } from '../lib/data'
import {
  getInvoiceBalance,
  isInvoiceInCollectionQueue,
  isMissionActive,
  mergeSearchParams,
} from '../lib/operations'
import { formatCurrencyWithDecimals, formatPhoneNumber, toSearchValue } from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'
import { appRoutes, getClientDetailRoute } from '../lib/routes'
import type { Client, CreateClientInput } from '../types'

const clientQueueOptions = [
  { value: 'all', label: 'All accounts' },
  { value: 'active', label: 'Active clients' },
  { value: 'ops', label: 'Active missions' },
  { value: 'billing', label: 'Open invoices' },
  { value: 'overdue', label: 'Overdue billing' },
] as const

export function Clients() {
  const navigate = useNavigate()
  const { organization } = useWorkspaceState()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const clientsQuery = useClients()
  const missionsQuery = useMissions()
  const invoicesQuery = useInvoices()

  const clients = clientsQuery.data ?? []
  const missions = missionsQuery.data ?? []
  const invoices = invoicesQuery.data ?? []
  const isLoading =
    clientsQuery.isLoading || missionsQuery.isLoading || invoicesQuery.isLoading
  const error =
    (clientsQuery.error instanceof Error && clientsQuery.error.message) ||
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    (invoicesQuery.error instanceof Error && invoicesQuery.error.message) ||
    null

  const queue = searchParams.get('queue') ?? 'all'
  const searchQuery = searchParams.get('q') ?? ''
  const statusFilter = searchParams.get('status') ?? ''

  const clientMetrics = useMemo(() => {
    const activeMissionCounts = new Map<string, number>()
    const totalMissionRevenue = new Map<string, number>()
    const openInvoiceCounts = new Map<string, number>()
    const overdueInvoiceCounts = new Map<string, number>()
    const openBalances = new Map<string, number>()

    missions.forEach((mission) => {
      totalMissionRevenue.set(
        mission.client_id,
        (totalMissionRevenue.get(mission.client_id) ?? 0) + mission.revenue_amount
      )

      if (isMissionActive(mission.status)) {
        activeMissionCounts.set(
          mission.client_id,
          (activeMissionCounts.get(mission.client_id) ?? 0) + 1
        )
      }
    })

    invoices.forEach((invoice) => {
      if (isInvoiceInCollectionQueue(invoice)) {
        openInvoiceCounts.set(
          invoice.client_id,
          (openInvoiceCounts.get(invoice.client_id) ?? 0) + 1
        )
        openBalances.set(
          invoice.client_id,
          (openBalances.get(invoice.client_id) ?? 0) + getInvoiceBalance(invoice)
        )
      }

      if (invoice.status === 'overdue') {
        overdueInvoiceCounts.set(
          invoice.client_id,
          (overdueInvoiceCounts.get(invoice.client_id) ?? 0) + 1
        )
      }
    })

    return {
      activeMissionCounts,
      totalMissionRevenue,
      openInvoiceCounts,
      overdueInvoiceCounts,
      openBalances,
    }
  }, [invoices, missions])

  const summary = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter((client) => client.status === 'active').length,
      ops: clients.filter(
        (client) => (clientMetrics.activeMissionCounts.get(client.client_id) ?? 0) > 0
      ).length,
      billing: clients.filter(
        (client) => (clientMetrics.openInvoiceCounts.get(client.client_id) ?? 0) > 0
      ).length,
      overdue: clients.filter(
        (client) => (clientMetrics.overdueInvoiceCounts.get(client.client_id) ?? 0) > 0
      ).length,
    }),
    [clientMetrics.activeMissionCounts, clientMetrics.openInvoiceCounts, clientMetrics.overdueInvoiceCounts, clients]
  )

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return [...clients]
      .filter((client) => {
        const activeMissions = clientMetrics.activeMissionCounts.get(client.client_id) ?? 0
        const openInvoices = clientMetrics.openInvoiceCounts.get(client.client_id) ?? 0
        const overdueInvoices = clientMetrics.overdueInvoiceCounts.get(client.client_id) ?? 0

        const matchesStatus = !statusFilter || client.status === statusFilter
        const matchesQueue =
          queue === 'all'
            ? true
            : queue === 'active'
              ? client.status === 'active'
              : queue === 'ops'
                ? activeMissions > 0
                : queue === 'billing'
                  ? openInvoices > 0
                  : overdueInvoices > 0

        if (!query) {
          return matchesStatus && matchesQueue
        }

        return (
          matchesStatus &&
          matchesQueue &&
          (
            toSearchValue(client.name).includes(query) ||
            toSearchValue(client.email).includes(query) ||
            toSearchValue(client.city).includes(query) ||
            toSearchValue(client.country).includes(query)
          )
        )
      })
      .sort((left, right) => {
        const leftOverdue = clientMetrics.overdueInvoiceCounts.get(left.client_id) ?? 0
        const rightOverdue = clientMetrics.overdueInvoiceCounts.get(right.client_id) ?? 0

        if (leftOverdue !== rightOverdue) {
          return rightOverdue - leftOverdue
        }

        const leftActive = clientMetrics.activeMissionCounts.get(left.client_id) ?? 0
        const rightActive = clientMetrics.activeMissionCounts.get(right.client_id) ?? 0

        if (leftActive !== rightActive) {
          return rightActive - leftActive
        }

        return left.name.localeCompare(right.name)
      })
  }, [
    clientMetrics.activeMissionCounts,
    clientMetrics.openInvoiceCounts,
    clientMetrics.overdueInvoiceCounts,
    clients,
    queue,
    searchQuery,
    statusFilter,
  ])

  const closeForm = () => {
    setShowForm(false)
    setSelectedClient(null)
    setActionError(null)
  }

  const updateFilters = (updates: Record<string, string | null>) => {
    setSearchParams(mergeSearchParams(searchParams, updates), { replace: true })
  }

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const handleSubmit = async (data: CreateClientInput) => {
    setIsSaving(true)
    setActionError(null)

    try {
      if (selectedClient) {
        await updateClient(selectedClient.client_id, data)
      } else {
        await createClient(data)
      }

      toast.success(selectedClient ? 'Client updated.' : 'Client created.')
      closeForm()
      await Promise.all([
        clientsQuery.refetch(),
        missionsQuery.refetch(),
        invoicesQuery.refetch(),
      ])
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save the client.'
      setActionError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const openClientDetail = (clientId: string) => {
    navigate(getClientDetailRoute(clientId))
  }

  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description={`Customer account view for ${organization?.name ?? 'the current workspace'}, tied directly to active missions and billing workload.`}
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedClient(null)
              setActionError(null)
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            New client
          </button>
        }
      />

      {showForm ? (
        <ModalSurface
          title={selectedClient ? 'Edit client' : 'Create client'}
          description="Keep customer records clean and reusable across missions and invoices."
          onClose={closeForm}
        >
          {actionError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
          <ClientForm
            initialData={selectedClient ?? undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            submitLabel={selectedClient ? 'Save client' : 'Create client'}
            isLoading={isSaving}
          />
        </ModalSurface>
      ) : null}

      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total clients"
            value={String(summary.total)}
            detail="All customer accounts"
            onClick={resetFilters}
          />
          <StatCard
            label="Active clients"
            value={String(summary.active)}
            detail="Accounts marked active"
            tone="success"
            onClick={() => updateFilters({ queue: 'active' })}
          />
          <StatCard
            label="Active operations"
            value={String(summary.ops)}
            detail="Clients with live mission workload"
            tone="warning"
            onClick={() => updateFilters({ queue: 'ops' })}
          />
          <StatCard
            label="Billing follow-up"
            value={String(summary.billing)}
            detail={`${summary.overdue} with overdue invoices`}
            tone={summary.overdue > 0 ? 'danger' : 'warning'}
            onClick={() => updateFilters({ queue: 'billing' })}
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
                  Filter accounts by relationship status, live operations, and billing pressure.
                </p>
              </div>

              <label className="relative mt-5 block">
                <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => updateFilters({ q: event.target.value || null })}
                  placeholder="Search client name, email, city, or country"
                  className="input-shell pl-11"
                />
              </label>

              <div className="mt-5 space-y-2">
                {clientQueueOptions.map((option) => {
                  const count =
                    option.value === 'active'
                      ? summary.active
                      : option.value === 'ops'
                        ? summary.ops
                        : option.value === 'billing'
                          ? summary.billing
                          : option.value === 'overdue'
                            ? summary.overdue
                            : summary.total

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFilters({ queue: option.value === 'all' ? null : option.value })}
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

              <select
                value={statusFilter}
                onChange={(event) => updateFilters({ status: event.target.value || null })}
                className="input-shell mt-5"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>

              <button type="button" onClick={resetFilters} className="btn-secondary mt-5 w-full">
                Reset filters
              </button>
            </SectionCard>
          </div>

          {isLoading ? (
            <PageLoadingSkeleton stats={4} rows={4} />
          ) : error ? (
            <StatePanel
              tone="danger"
              title="Unable to load clients"
              message={error}
              action={
                <button
                  type="button"
                  onClick={() => {
                    void Promise.all([
                      clientsQuery.refetch(),
                      missionsQuery.refetch(),
                      invoicesQuery.refetch(),
                    ])
                  }}
                  className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  Retry
                </button>
              }
            />
          ) : filteredClients.length === 0 ? (
            <StatePanel
              title={clients.length === 0 ? 'No clients yet' : 'No matching clients'}
              message={
                clients.length === 0
                  ? 'Create the first client to unlock mission planning and invoice creation.'
                  : 'Adjust the current queue or filters to surface another account.'
              }
              action={
                clients.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null)
                      setShowForm(true)
                    }}
                    className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                  >
                    Create client
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
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Client accounts
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {filteredClients.length} visible client
                    {filteredClients.length === 1 ? '' : 's'} with live operations and billing
                    workload surfaced beside core account data.
                  </p>
                </div>
                <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
                  {queue === 'all' ? 'All accounts' : `Queue: ${queue.replace('-', ' ')}`}
                </div>
              </div>

              <div className="divide-y divide-stone-200">
                {filteredClients.map((client) => {
                  const status = getClientStatusConfig(client.status)
                  const activeMissions = clientMetrics.activeMissionCounts.get(client.client_id) ?? 0
                  const openInvoices = clientMetrics.openInvoiceCounts.get(client.client_id) ?? 0
                  const overdueInvoices = clientMetrics.overdueInvoiceCounts.get(client.client_id) ?? 0
                  const openBalance = clientMetrics.openBalances.get(client.client_id) ?? 0
                  const revenue = clientMetrics.totalMissionRevenue.get(client.client_id) ?? 0

                  return (
                    <article
                      key={client.client_id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openClientDetail(client.client_id)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) {
                          return
                        }

                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openClientDetail(client.client_id)
                        }
                      }}
                      className="grid cursor-pointer gap-4 px-5 py-4 transition hover:bg-stone-50/80 focus-within:bg-stone-50/80 md:grid-cols-[minmax(0,1.1fr)_180px_220px_240px_auto] md:items-start"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold text-stone-950">{client.name}</h2>
                          <StatusBadge
                            label={status.label}
                            tone={
                              client.status === 'active'
                                ? 'success'
                                : client.status === 'inactive'
                                  ? 'warning'
                                  : 'neutral'
                            }
                          />
                          {overdueInvoices > 0 ? (
                            <StatusBadge label="overdue billing" tone="danger" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-stone-900">{client.email}</p>
                        <p className="mt-1 text-sm text-stone-500">
                          {[client.city, client.country].filter(Boolean).join(', ') || 'No location set'}
                        </p>
                        {client.notes ? (
                          <p className="mt-2 text-sm text-stone-500">{client.notes}</p>
                        ) : null}
                      </div>

                      <div className="text-sm text-stone-500">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                          Contact
                        </p>
                        <p className="mt-1 font-medium text-stone-900">
                          {formatPhoneNumber(client.phone)}
                        </p>
                        <p className="mt-1">
                          {client.vat_number || 'VAT not provided'}
                        </p>
                      </div>

                      <div className="text-sm text-stone-500">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                          Operations
                        </p>
                        <p className="mt-1 font-medium text-stone-900">
                          {activeMissions} active mission{activeMissions === 1 ? '' : 's'}
                        </p>
                        <p className="mt-1">
                          Revenue {formatCurrencyWithDecimals(revenue)}
                        </p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate({
                              pathname: appRoutes.missions,
                              search: createSearchParams({ client: client.client_id }).toString(),
                            })
                          }}
                          className="mt-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                        >
                          Open missions
                        </button>
                      </div>

                      <div className="text-sm text-stone-500">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                          Billing
                        </p>
                        <p className="mt-1 font-medium text-stone-900">
                          {openInvoices} open invoice{openInvoices === 1 ? '' : 's'}
                        </p>
                        <p className="mt-1">
                          Balance {formatCurrencyWithDecimals(openBalance)}
                        </p>
                        <p className="mt-1">{overdueInvoices} overdue</p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate({
                              pathname: appRoutes.invoices,
                              search: createSearchParams({ client: client.client_id }).toString(),
                            })
                          }}
                          className="mt-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                        >
                          Open invoices
                        </button>
                      </div>

                      <div className="flex items-start justify-end">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedClient(client)
                            setActionError(null)
                            setShowForm(true)
                          }}
                          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                        >
                          Edit
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
