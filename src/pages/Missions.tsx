import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import clsx from 'clsx'
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { MissionEditorForm, type MissionEditorInput } from '../components/MissionEditorForm'
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
import { createMissionRecord, updateMissionRecord } from '../lib/api/missions'
import {
  getMissionInvoiceMap,
  getMissionMarginSnapshot,
  isMissionActive,
  mergeSearchParams,
} from '../lib/operations'
import { appRoutes } from '../lib/routes'
import {
  formatCurrencyWithDecimals,
  formatDateTime,
  formatPercentage,
  toSearchValue,
} from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'
import type { Mission } from '../types/domain'
import { MissionStatus } from '../types/enums'

function missionTone(status: Mission['status']) {
  switch (status) {
    case MissionStatus.Delivered:
      return 'success' as const
    case MissionStatus.InProgress:
      return 'info' as const
    case MissionStatus.Issue:
      return 'danger' as const
    case MissionStatus.Assigned:
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

const missionQueueOptions = [
  { value: 'all', label: 'All missions' },
  { value: 'active', label: 'Active queue' },
  { value: 'uninvoiced', label: 'Not invoiced' },
  { value: 'margin', label: 'Margin-sensitive' },
  { value: 'issues', label: 'Issue status' },
] as const

export function Missions() {
  const navigate = useNavigate()
  const { organization } = useWorkspaceState()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const missionsQuery = useMissions()
  const clientsQuery = useClients()
  const invoicesQuery = useInvoices()

  const missions = missionsQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const invoices = invoicesQuery.data ?? []
  const isLoading =
    missionsQuery.isLoading || clientsQuery.isLoading || invoicesQuery.isLoading
  const error =
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    (clientsQuery.error instanceof Error && clientsQuery.error.message) ||
    (invoicesQuery.error instanceof Error && invoicesQuery.error.message) ||
    null

  const queue = searchParams.get('queue') ?? 'all'
  const searchQuery = searchParams.get('q') ?? ''
  const statusFilter = (searchParams.get('status') ?? '') as Mission['status'] | ''
  const clientFilter = searchParams.get('client') ?? ''
  const invoiceFilter = searchParams.get('invoice') ?? ''
  const focusMissionId = searchParams.get('focus') ?? ''

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.client_id, client.name] as const)),
    [clients]
  )

  const invoiceById = useMemo(
    () => new Map(invoices.map((invoice) => [invoice.invoice_id, invoice] as const)),
    [invoices]
  )

  const missionInvoiceMap = useMemo(() => getMissionInvoiceMap(invoices), [invoices])

  const summary = useMemo(
    () => ({
      total: missions.length,
      active: missions.filter((mission) => isMissionActive(mission.status)).length,
      uninvoiced: missions.filter((mission) => {
        const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
        return isMissionActive(mission.status) && linkedInvoices.length === 0
      }).length,
      marginSensitive: missions.filter((mission) =>
        getMissionMarginSnapshot(mission).isSensitive
      ).length,
    }),
    [missionInvoiceMap, missions]
  )

  const filteredMissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return [...missions]
      .filter((mission) => {
        const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
        const margin = getMissionMarginSnapshot(mission)
        const matchesStatus = !statusFilter || mission.status === statusFilter
        const matchesClient = !clientFilter || mission.client_id === clientFilter
        const matchesInvoice =
          !invoiceFilter || linkedInvoices.some((invoice) => invoice.invoice_id === invoiceFilter)

        const matchesQueue =
          queue === 'all'
            ? true
            : queue === 'active'
              ? isMissionActive(mission.status)
              : queue === 'uninvoiced'
                ? isMissionActive(mission.status) && linkedInvoices.length === 0
                : queue === 'margin'
                  ? margin.isSensitive
                  : mission.status === MissionStatus.Issue

        if (!query) {
          return matchesStatus && matchesClient && matchesInvoice && matchesQueue
        }

        return (
          matchesStatus &&
          matchesClient &&
          matchesInvoice &&
          matchesQueue &&
          (
            toSearchValue(mission.reference).includes(query) ||
            toSearchValue(clientNameById.get(mission.client_id)).includes(query) ||
            toSearchValue(mission.driver_name).includes(query) ||
            toSearchValue(mission.vehicle_name).includes(query) ||
            toSearchValue(
              `${mission.departure_location} ${mission.arrival_location}`
            ).includes(query) ||
            linkedInvoices.some((invoice) =>
              toSearchValue(invoice.invoice_number).includes(query)
            )
          )
        )
      })
      .sort((left, right) => {
        if (left.mission_id === focusMissionId) {
          return -1
        }

        if (right.mission_id === focusMissionId) {
          return 1
        }

        if (isMissionActive(left.status) && !isMissionActive(right.status)) {
          return -1
        }

        if (!isMissionActive(left.status) && isMissionActive(right.status)) {
          return 1
        }

        return (
          new Date(right.departure_datetime).getTime() -
          new Date(left.departure_datetime).getTime()
        )
      })
  }, [
    clientFilter,
    clientNameById,
    focusMissionId,
    invoiceFilter,
    missionInvoiceMap,
    missions,
    queue,
    searchQuery,
    statusFilter,
  ])

  const closeForm = () => {
    setShowForm(false)
    setSelectedMission(null)
    setActionError(null)
  }

  const updateFilters = (updates: Record<string, string | null>) => {
    setSearchParams(mergeSearchParams(searchParams, { ...updates, focus: null }), {
      replace: true,
    })
  }

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const openCreate = () => {
    if (clients.length === 0) {
      toast('Create a client first to open mission planning.')
      navigate(appRoutes.clients)
      return
    }

    setSelectedMission(null)
    setActionError(null)
    setShowForm(true)
  }

  const handleSave = async (payload: MissionEditorInput) => {
    if (!organization) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    try {
      if (selectedMission) {
        await updateMissionRecord(selectedMission.mission_id, payload)
      } else {
        await createMissionRecord(organization.organization_id, payload)
      }

      toast.success(selectedMission ? 'Mission updated.' : 'Mission created.')
      closeForm()
      await Promise.all([
        missionsQuery.refetch(),
        clientsQuery.refetch(),
        invoicesQuery.refetch(),
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

  const filteredInvoice = invoiceFilter ? invoiceById.get(invoiceFilter) : null

  return (
    <PageContainer>
      <PageHeader
        title="Missions"
        description={`Operational queue for ${organization?.name ?? 'the current workspace'}, with assignment, margin, and invoice linkage exposed directly in the list.`}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            New mission
          </button>
        }
      />

      {showForm ? (
        <ModalSurface
          title={selectedMission ? 'Edit mission' : 'Create mission'}
          description="Create only from the stable mission contract: client, route, assignment names, schedule, and margin."
          onClose={closeForm}
        >
          {actionError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
          <MissionEditorForm
            clients={clients}
            initialData={selectedMission ?? undefined}
            onSubmit={handleSave}
            onCancel={closeForm}
            isLoading={isSaving}
          />
        </ModalSurface>
      ) : null}

      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total missions"
            value={String(summary.total)}
            detail="All mission records"
            onClick={resetFilters}
          />
          <StatCard
            label="Active queue"
            value={String(summary.active)}
            detail="Planned, assigned, or in progress"
            tone="warning"
            onClick={() => updateFilters({ queue: 'active' })}
          />
          <StatCard
            label="Not invoiced"
            value={String(summary.uninvoiced)}
            detail="Active missions missing invoice linkage"
            tone={summary.uninvoiced > 0 ? 'warning' : 'default'}
            onClick={() => updateFilters({ queue: 'uninvoiced' })}
          />
          <StatCard
            label="Margin-sensitive"
            value={String(summary.marginSensitive)}
            detail="Current margin under the working threshold"
            tone={summary.marginSensitive > 0 ? 'danger' : 'default'}
            onClick={() => updateFilters({ queue: 'margin' })}
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
                  Keep the mission queue tight around billing, status, and ownership.
                </p>
              </div>

              <label className="relative mt-5 block">
                <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => updateFilters({ q: event.target.value || null })}
                  placeholder="Search mission, client, route, driver, or invoice"
                  className="input-shell pl-11"
                />
              </label>

              <div className="mt-5 space-y-2">
                {missionQueueOptions.map((option) => (
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
                    {option.value === 'active' ? (
                      <span>{summary.active}</span>
                    ) : option.value === 'uninvoiced' ? (
                      <span>{summary.uninvoiced}</span>
                    ) : option.value === 'margin' ? (
                      <span>{summary.marginSensitive}</span>
                    ) : option.value === 'issues' ? (
                      <span>
                        {
                          missions.filter((mission) => mission.status === MissionStatus.Issue)
                            .length
                        }
                      </span>
                    ) : (
                      <span>{summary.total}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-4">
                <select
                  value={clientFilter}
                  onChange={(event) =>
                    updateFilters({ client: event.target.value || null })
                  }
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
                      status: (event.target.value || null) as Mission['status'] | null,
                    })
                  }
                  className="input-shell"
                >
                  <option value="">All statuses</option>
                  <option value={MissionStatus.Planned}>Planned</option>
                  <option value={MissionStatus.Assigned}>Assigned</option>
                  <option value={MissionStatus.InProgress}>In progress</option>
                  <option value={MissionStatus.Delivered}>Delivered</option>
                  <option value={MissionStatus.Issue}>Issue</option>
                  <option value={MissionStatus.Cancelled}>Cancelled</option>
                </select>
              </div>

              {filteredInvoice ? (
                <div className="mt-5 rounded-[1.2rem] border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                    Invoice context
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {filteredInvoice.invoice_number}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Only missions linked to this invoice are visible.
                  </p>
                </div>
              ) : null}

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
              title="Unable to load missions"
              message={error}
              action={
                <button
                  type="button"
                  onClick={() => {
                    void Promise.all([
                      missionsQuery.refetch(),
                      clientsQuery.refetch(),
                      invoicesQuery.refetch(),
                    ])
                  }}
                  className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  Retry
                </button>
              }
            />
          ) : filteredMissions.length === 0 ? (
            <StatePanel
              title={missions.length === 0 ? 'No missions yet' : 'No matching missions'}
              message={
                missions.length === 0
                  ? clients.length === 0
                    ? 'Create a client first, then start adding missions.'
                    : 'Create the first mission to populate operations tracking.'
                  : 'Adjust the current queue or filters to reveal another mission.'
              }
              action={
                missions.length === 0 ? (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                  >
                    {clients.length === 0 ? 'Open clients' : 'Create mission'}
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
                    Mission queue
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {filteredMissions.length} visible mission
                    {filteredMissions.length === 1 ? '' : 's'} with assignment, margin, and
                    invoice context kept in one row.
                  </p>
                </div>
                <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
                  {queue === 'all' ? 'All missions' : `Queue: ${queue.replace('-', ' ')}`}
                </div>
              </div>

              <div className="divide-y divide-stone-200">
                {filteredMissions.map((mission) => {
                  const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
                  const margin = getMissionMarginSnapshot(mission)

                  return (
                    <article
                      key={mission.mission_id}
                      className={clsx(
                        'grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_170px_210px_240px_auto] md:items-start',
                        focusMissionId === mission.mission_id && 'bg-amber-50/50'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold text-stone-950">
                            {mission.reference}
                          </h2>
                          <StatusBadge
                            label={mission.status.replace('_', ' ')}
                            tone={missionTone(mission.status)}
                          />
                          {linkedInvoices.length === 0 ? (
                            <StatusBadge label="not invoiced" tone="warning" />
                          ) : null}
                          {margin.isSensitive ? (
                            <StatusBadge label="margin sensitive" tone="danger" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-stone-900">
                          {mission.departure_location} to {mission.arrival_location}
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          {clientNameById.get(mission.client_id) ?? 'Unknown client'}
                        </p>
                        {mission.notes ? (
                          <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                            {mission.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-sm text-stone-500">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                          Schedule
                        </p>
                        <p className="mt-1 font-medium text-stone-900">
                          {formatDateTime(mission.departure_datetime)}
                        </p>
                        <p className="mt-1">
                          {mission.arrival_datetime
                            ? formatDateTime(mission.arrival_datetime)
                            : 'Arrival not set'}
                        </p>
                      </div>

                      <div className="text-sm text-stone-500">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                          Assignment
                        </p>
                        <p className="mt-1 font-medium text-stone-900">
                          {mission.driver_name || 'Driver unassigned'}
                        </p>
                        <p className="mt-1">
                          {mission.vehicle_name || 'Vehicle not set'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                            Finance
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {formatCurrencyWithDecimals(mission.revenue_amount)}
                          </p>
                          <p className="mt-1">
                            Margin {formatPercentage(margin.marginRatio * 100, 0)}
                          </p>
                          <p className="mt-1">
                            {margin.sourceLabel} cost{' '}
                            {formatCurrencyWithDecimals(margin.baselineCost)}
                          </p>
                        </div>

                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                            Invoice linkage
                          </p>
                          {linkedInvoices.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {linkedInvoices.map((invoice) => (
                                <button
                                  key={invoice.invoice_id}
                                  type="button"
                                  onClick={() =>
                                    navigate({
                                      pathname: appRoutes.invoices,
                                      search: createSearchParams({
                                        mission: mission.mission_id,
                                        focus: invoice.invoice_id,
                                      }).toString(),
                                    })
                                  }
                                  className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                                >
                                  {invoice.invoice_number}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                                Not invoiced
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate({
                                    pathname: appRoutes.invoices,
                                    search: createSearchParams({
                                      mission: mission.mission_id,
                                    }).toString(),
                                  })
                                }
                                className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                              >
                                Open invoicing
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMission(mission)
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
