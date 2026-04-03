import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, FilePlus2, Link2, Plus, Search } from 'lucide-react'
import clsx from 'clsx'
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { MissionEditorForm, type MissionEditorInput } from '../components/MissionEditorForm'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import {
  ActiveFilterBar,
  DensityToggle,
  ModalSurface,
  PageLoadingSkeleton,
  SelectionToolbar,
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
import { appRoutes, getMissionDetailRoute } from '../lib/routes'
import {
  formatCurrencyWithDecimals,
  formatDateTime,
  formatPercentage,
  toSearchValue,
  truncateString,
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

const missionStatusLabels: Record<Mission['status'], string> = {
  planned: 'Planned',
  assigned: 'Assigned',
  in_progress: 'In progress',
  delivered: 'Delivered',
  issue: 'Issue',
  cancelled: 'Cancelled',
}

const missionQueueOptions = [
  { value: 'all', label: 'All missions' },
  { value: 'active', label: 'Active queue' },
  { value: 'uninvoiced', label: 'Not invoiced' },
  { value: 'margin', label: 'Margin-sensitive' },
  { value: 'issues', label: 'Issue status' },
] as const

const inlineLinkButtonClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const primaryActionButtonClasses =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-stone-950 px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-stone-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const tertiaryActionButtonClasses =
  'inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const rowDetailButtonClasses =
  'rounded-[1rem] px-1 py-1 text-left transition hover:bg-white/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const checkboxClasses =
  'h-4 w-4 rounded border-stone-300 accent-stone-900 text-stone-900 shadow-sm focus:ring-stone-300'

const densityStorageKey = 'kepler.ops.queue-density'

export function Missions() {
  const navigate = useNavigate()
  const { organization } = useWorkspaceState()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [selectedMissionIds, setSelectedMissionIds] = useState<string[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [density, setDensity] = useState<'compact' | 'comfortable'>(() => {
    if (typeof window === 'undefined') {
      return 'compact'
    }

    const savedDensity = window.localStorage.getItem(densityStorageKey)
    return savedDensity === 'comfortable' ? 'comfortable' : 'compact'
  })
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
  const composeIntent = searchParams.get('compose') ?? ''

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.client_id, client.name] as const)),
    [clients]
  )

  const missionById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission] as const)),
    [missions]
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
      issues: missions.filter((mission) => mission.status === MissionStatus.Issue).length,
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

  const allVisibleSelected =
    filteredMissions.length > 0 &&
    filteredMissions.every((mission) => selectedMissionIds.includes(mission.mission_id))

  const someVisibleSelected = selectedMissionIds.length > 0 && !allVisibleSelected

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

  const clearFocus = () => {
    setSearchParams(mergeSearchParams(searchParams, { focus: null }), {
      replace: true,
    })
  }

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const clearSelection = () => {
    setSelectedMissionIds([])
  }

  const toggleMissionSelection = (missionId: string) => {
    setSelectedMissionIds((current) =>
      current.includes(missionId)
        ? current.filter((value) => value !== missionId)
        : [...current, missionId]
    )
  }

  const toggleAllVisibleMissions = () => {
    setSelectedMissionIds((current) => {
      if (allVisibleSelected) {
        return current.filter(
          (missionId) => !filteredMissions.some((mission) => mission.mission_id === missionId)
        )
      }

      const next = new Set(current)
      filteredMissions.forEach((mission) => {
        next.add(mission.mission_id)
      })

      return [...next]
    })
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

  useEffect(() => {
    setSelectedMissionIds((current) =>
      current.filter((missionId) =>
        filteredMissions.some((mission) => mission.mission_id === missionId)
      )
    )
  }, [filteredMissions])

  useEffect(() => {
    if (composeIntent !== 'new' || showForm || selectedMission || isLoading) {
      return
    }

    openCreate()
    setSearchParams(mergeSearchParams(searchParams, { compose: null }), {
      replace: true,
    })
  }, [
    composeIntent,
    isLoading,
    openCreate,
    searchParams,
    selectedMission,
    setSearchParams,
    showForm,
  ])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return
      }

      if (event.key !== 'Escape') {
        return
      }

      if (showForm) {
        closeForm()
        return
      }

      if (selectedMissionIds.length > 0) {
        clearSelection()
        return
      }

      if (focusMissionId) {
        clearFocus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [focusMissionId, selectedMissionIds.length, showForm])

  const filteredInvoice = invoiceFilter ? invoiceById.get(invoiceFilter) : null
  const focusedMission = focusMissionId ? missionById.get(focusMissionId) : null
  const queueLabel =
    missionQueueOptions.find((option) => option.value === queue)?.label ?? 'All missions'

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
          value: missionStatusLabels[statusFilter] ?? statusFilter,
          onClear: () => updateFilters({ status: null }),
        }
      : null,
    filteredInvoice
      ? {
          id: 'invoice',
          label: 'Invoice',
          value: filteredInvoice.invoice_number,
          onClear: () => updateFilters({ invoice: null }),
        }
      : null,
    focusedMission
      ? {
          id: 'mission',
          label: 'Mission',
          value: focusedMission.reference,
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(densityStorageKey, density)
  }, [density])

  const isCompact = density === 'compact'

  return (
    <PageContainer>
      <PageHeader
        title="Missions"
        description={`Operational mission queue for ${organization?.name ?? 'the current workspace'}.`}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary"
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
              </div>

              <label className="relative mt-5 block">
                <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-500" />
                <input
                  type="text"
                  data-ops-search="true"
                  value={searchQuery}
                  onChange={(event) => updateFilters({ q: event.target.value || null })}
                  placeholder="Search mission, client, route, driver, or invoice"
                  className="input-shell pl-11"
                />
              </label>

              <div className="mt-5 space-y-2">
                {missionQueueOptions.map((option) => {
                  const count =
                    option.value === 'active'
                      ? summary.active
                      : option.value === 'uninvoiced'
                        ? summary.uninvoiced
                        : option.value === 'margin'
                          ? summary.marginSensitive
                          : option.value === 'issues'
                            ? summary.issues
                            : summary.total

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
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-100'
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

              <button type="button" onClick={resetFilters} className="btn-secondary mt-5 w-full">
                Reset filters
              </button>
            </SectionCard>
          </div>

          <div className="space-y-3">
            {activeFilterItems.length > 0 ? (
              <ActiveFilterBar items={activeFilterItems} onClearAll={resetFilters} />
            ) : null}

            <SelectionToolbar
              count={selectedMissionIds.length}
              onClear={clearSelection}
            />

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
                    className="btn-primary"
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
                    className="btn-primary"
                  >
                    {clients.length === 0 ? 'Open clients' : 'Create mission'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn-secondary"
                  >
                    Reset filters
                  </button>
                  )
                }
              />
            ) : (
              <SectionCard className="overflow-hidden p-0">
                <div
                  className={clsx(
                    'flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4',
                    isCompact ? 'py-2.5' : 'py-3'
                  )}
                >
                  <div>
                    <h2
                      className={clsx(
                        'font-heading font-semibold tracking-tight text-stone-950',
                        isCompact ? 'text-[1.65rem]' : 'text-2xl'
                      )}
                    >
                      Mission queue
                    </h2>
                    <p className={clsx('text-stone-600', isCompact ? 'mt-0.5 text-xs' : 'mt-1 text-sm')}>
                      Showing {filteredMissions.length} of {missions.length} mission
                      {filteredMissions.length === 1 ? '' : 's'}.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleAllVisibleMissions}
                      className={clsx(tertiaryActionButtonClasses, 'md:hidden')}
                    >
                      {allVisibleSelected ? 'Clear visible' : 'Select visible'}
                    </button>
                    <DensityToggle value={density} onChange={setDensity} />
                    <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
                      {queueLabel}
                    </div>
                  </div>
                </div>

                <div
                  className={clsx(
                    'hidden border-b border-stone-200 bg-stone-50/70 px-4 md:grid md:grid-cols-[minmax(0,1.35fr)_155px_175px_235px_135px] md:gap-3',
                    isCompact ? 'py-1.5' : 'py-2'
                  )}
                >
                  <span className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(node) => {
                        if (node) {
                          node.indeterminate = someVisibleSelected
                        }
                      }}
                      onChange={toggleAllVisibleMissions}
                      aria-label="Select visible missions"
                      className={checkboxClasses}
                    />
                    <span>Mission</span>
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    Schedule
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    Assignment
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    Finance / Invoice
                  </span>
                  <span className="text-right text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    Actions
                  </span>
                </div>

                <div className="divide-y divide-stone-200">
                  {filteredMissions.map((mission) => {
                    const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
                    const visibleLinkedInvoices = linkedInvoices.slice(0, 2)
                    const remainingLinkedInvoiceCount =
                      linkedInvoices.length - visibleLinkedInvoices.length
                    const margin = getMissionMarginSnapshot(mission)
                    const primaryInvoice = linkedInvoices[0]
                    const isCritical = linkedInvoices.length === 0
                    const isFocused = focusMissionId === mission.mission_id
                    const isIssue = mission.status === MissionStatus.Issue
                    const isUninvoiced = linkedInvoices.length === 0
                    const isMediumPriority = !isCritical && margin.isSensitive
                    const isSelected = selectedMissionIds.includes(mission.mission_id)

                    return (
                      <article
                        key={mission.mission_id}
                        className={clsx(
                          'group grid border-l-2 px-4 transition-[background-color,border-color,box-shadow] duration-150 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] focus-within:border-l-sky-400 focus-within:bg-sky-50/40 md:grid-cols-[minmax(0,1.35fr)_155px_175px_235px_135px] md:items-center',
                          isCompact ? 'gap-2.5 py-2.5' : 'gap-3 py-3',
                          isSelected &&
                            'shadow-[inset_0_0_0_1px_rgba(41,37,36,0.14)]',
                          isFocused
                            ? clsx(
                                'border-l-sky-500 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.38),inset_0_1px_0_rgba(255,255,255,0.72)]',
                                isSelected ? 'bg-sky-100/55' : 'bg-sky-50/45'
                              )
                            : isCritical
                              ? clsx(
                                  'border-l-amber-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] hover:bg-amber-50/70',
                                  isSelected ? 'bg-amber-100/55' : 'bg-amber-50/45'
                                )
                              : isIssue
                                ? clsx(
                                    'border-l-rose-400 hover:bg-rose-50/40',
                                    isSelected ? 'bg-rose-100/45' : 'bg-rose-50/25'
                                  )
                              : isMediumPriority
                                ? clsx(
                                    'border-l-amber-200 hover:bg-amber-50/35',
                                    isSelected ? 'bg-amber-100/40' : 'bg-amber-50/20'
                                  )
                                : isSelected
                                  ? 'border-l-stone-300 bg-stone-100/80'
                                  : 'border-l-transparent hover:border-l-stone-300 hover:bg-stone-100'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedMissionIds.includes(mission.mission_id)}
                            onChange={() => toggleMissionSelection(mission.mission_id)}
                            aria-label={`Select mission ${mission.reference}`}
                            className={clsx(checkboxClasses, 'mt-0.5 shrink-0')}
                          />
                          <button
                            type="button"
                            onClick={() => navigate(getMissionDetailRoute(mission.mission_id))}
                            className={clsx('min-w-0 flex-1', rowDetailButtonClasses)}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-stone-950">
                                {mission.reference}
                              </h2>
                              <StatusBadge
                                label={missionStatusLabels[mission.status]}
                                tone={missionTone(mission.status)}
                              />
                              {isFocused ? (
                                <StatusBadge label="focus" tone="info" />
                              ) : null}
                              {isUninvoiced ? (
                                <StatusBadge
                                  label="Not invoiced"
                                  tone="warning"
                                  className="font-semibold"
                                />
                              ) : null}
                              {margin.isSensitive ? (
                                <StatusBadge label="margin sensitive" tone="danger" />
                              ) : null}
                            </div>
                            <div className="mt-1 flex min-w-0 items-center gap-2 text-sm font-medium text-stone-950">
                              <span className="truncate">{mission.departure_location}</span>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                              <span className="truncate">{mission.arrival_location}</span>
                            </div>
                            <div
                              className={clsx(
                                'flex min-w-0 items-center gap-2 text-stone-600',
                                isCompact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'
                              )}
                            >
                              <span className="truncate">
                                {clientNameById.get(mission.client_id) ?? 'Unknown client'}
                              </span>
                              {mission.notes && !isCompact ? (
                                <>
                                  <span className="text-stone-300">/</span>
                                  <span className="truncate text-stone-600">
                                    {mission.notes}
                                  </span>
                                </>
                              ) : null}
                            </div>
                            {mission.notes && isCompact ? (
                              <p className="hidden pt-0.5 text-[11px] text-stone-600 md:block">
                                {truncateString(mission.notes, 84)}
                              </p>
                            ) : null}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(getMissionDetailRoute(mission.mission_id))}
                          className={clsx(rowDetailButtonClasses, 'text-sm text-stone-600')}
                        >
                          <p className="font-medium text-stone-900">
                            {formatDateTime(mission.departure_datetime)}
                          </p>
                          <p className={clsx('text-stone-600', isCompact ? 'mt-0.5 text-xs' : 'mt-1')}>
                            Arrives{' '}
                            {mission.arrival_datetime
                              ? formatDateTime(mission.arrival_datetime)
                              : 'not set'}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(getMissionDetailRoute(mission.mission_id))}
                          className={clsx(rowDetailButtonClasses, 'text-sm text-stone-600')}
                        >
                          <p className="font-medium text-stone-900">
                            {mission.driver_name || 'Driver unassigned'}
                          </p>
                          <p className={clsx('text-stone-600', isCompact ? 'mt-0.5 text-xs' : 'mt-1')}>
                            {mission.vehicle_name || 'Vehicle not set'}
                          </p>
                        </button>

                        <div
                          className={clsx(
                            'text-sm text-stone-600',
                            isCompact ? 'space-y-2' : 'space-y-2.5'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => navigate(getMissionDetailRoute(mission.mission_id))}
                            className={clsx('w-full', rowDetailButtonClasses)}
                          >
                            <p className="font-medium text-stone-900 tabular-nums">
                              {formatCurrencyWithDecimals(mission.revenue_amount)}
                            </p>
                            <p
                              className={clsx(
                                isCompact ? 'mt-0.5 text-xs' : 'mt-1',
                                margin.isSensitive ? 'font-medium text-rose-700' : undefined
                              )}
                            >
                              Margin {formatPercentage(margin.marginRatio * 100, 0)}
                            </p>
                            <p className={clsx(isCompact ? 'mt-0.5 text-xs' : 'mt-1')}>
                              {margin.sourceLabel} cost{' '}
                              {formatCurrencyWithDecimals(margin.baselineCost)}
                            </p>
                          </button>

                          <div className="border-t border-dashed border-stone-200 pt-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
                              <span>Mission</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>Invoice</span>
                            </div>
                            {linkedInvoices.length > 0 ? (
                              <>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-stone-900">Billed</p>
                                  <span className="text-xs text-stone-500">
                                    {linkedInvoices.length} invoice
                                    {linkedInvoices.length === 1 ? '' : 's'}
                                  </span>
                                </div>
                                <div
                                  className={clsx(
                                    'flex flex-wrap gap-1.5',
                                    isCompact ? 'mt-1.5' : 'mt-2'
                                  )}
                                >
                                  {visibleLinkedInvoices.map((invoice) => (
                                    <button
                                      key={invoice.invoice_id}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        navigate({
                                          pathname: appRoutes.invoices,
                                          search: createSearchParams({
                                            mission: mission.mission_id,
                                            focus: invoice.invoice_id,
                                          }).toString(),
                                        })
                                      }}
                                      className={inlineLinkButtonClasses}
                                    >
                                      <Link2 className="h-3 w-3" />
                                      <span>{invoice.invoice_number}</span>
                                    </button>
                                  ))}
                                  {remainingLinkedInvoiceCount > 0 ? (
                                    <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-500">
                                      +{remainingLinkedInvoiceCount} more
                                    </span>
                                  ) : null}
                                </div>
                              </>
                            ) : (
                              <div className="mt-1.5">
                                <p className="font-medium text-amber-900">Not invoiced</p>
                                <p
                                  className={clsx(
                                    'text-stone-700',
                                    isCompact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'
                                  )}
                                >
                                  Billing action required.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-stretch gap-1.5 md:items-end">
                          {linkedInvoices.length > 0 && primaryInvoice ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                navigate({
                                  pathname: appRoutes.invoices,
                                  search: createSearchParams({
                                    mission: mission.mission_id,
                                    focus: primaryInvoice.invoice_id,
                                  }).toString(),
                                })
                              }}
                              className={primaryActionButtonClasses}
                              title={primaryInvoice.invoice_number}
                            >
                              <span>
                                {linkedInvoices.length === 1
                                  ? `View ${truncateString(primaryInvoice.invoice_number, 16)}`
                                  : `View ${linkedInvoices.length} invoices`}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                navigate({
                                  pathname: appRoutes.invoices,
                                  search: createSearchParams({
                                    mission: mission.mission_id,
                                    compose: 'new',
                                  }).toString(),
                                })
                              }}
                              className={primaryActionButtonClasses}
                            >
                              <FilePlus2 className="h-3.5 w-3.5" />
                              <span>Create invoice</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedMission(mission)
                              setActionError(null)
                              setShowForm(true)
                            }}
                            className={tertiaryActionButtonClasses}
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
      </div>
    </PageContainer>
  )
}
