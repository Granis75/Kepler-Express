import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
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
import { useClients, useMissions } from '../hooks'
import { createMissionRecord, updateMissionRecord } from '../lib/api/missions'
import { appRoutes } from '../lib/routes'
import { formatCurrencyWithDecimals, formatDateTime, toSearchValue } from '../lib/utils'
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

export function Missions() {
  const navigate = useNavigate()
  const { organization } = useWorkspaceState()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Mission['status'] | ''>('')
  const [showForm, setShowForm] = useState(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const missionsQuery = useMissions()
  const clientsQuery = useClients()

  const missions = missionsQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const isLoading = missionsQuery.isLoading || clientsQuery.isLoading
  const error =
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    (clientsQuery.error instanceof Error && clientsQuery.error.message) ||
    null

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.client_id, client.name] as const)),
    [clients]
  )

  const filteredMissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return [...missions]
      .filter((mission) => {
        const matchesStatus = !statusFilter || mission.status === statusFilter

        if (!query) {
          return matchesStatus
        }

        return (
          matchesStatus &&
          (
            toSearchValue(mission.reference).includes(query) ||
            toSearchValue(clientNameById.get(mission.client_id)).includes(query) ||
            toSearchValue(mission.driver_name).includes(query) ||
            toSearchValue(mission.vehicle_name).includes(query) ||
            toSearchValue(
              `${mission.departure_location} ${mission.arrival_location}`
            ).includes(query)
          )
        )
      })
      .sort(
        (left, right) =>
          new Date(right.departure_datetime).getTime() -
          new Date(left.departure_datetime).getTime()
      )
  }, [clientNameById, missions, searchQuery, statusFilter])

  const summary = useMemo(
    () => ({
      total: missions.length,
      active: missions.filter((mission) =>
        [MissionStatus.Planned, MissionStatus.Assigned, MissionStatus.InProgress].includes(
          mission.status as MissionStatus
        )
      ).length,
      delivered: missions.filter((mission) => mission.status === MissionStatus.Delivered).length,
      issues: missions.filter((mission) => mission.status === MissionStatus.Issue).length,
    }),
    [missions]
  )

  const closeForm = () => {
    setShowForm(false)
    setSelectedMission(null)
    setActionError(null)
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
      await Promise.all([missionsQuery.refetch(), clientsQuery.refetch()])
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save the mission.'
      setActionError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Missions"
        description={`Live operations across ${organization?.name ?? 'the current workspace'}, with route, assignment, and financial context in one place.`}
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

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total missions" value={String(summary.total)} />
          <StatCard label="Active" value={String(summary.active)} tone="warning" />
          <StatCard label="Delivered" value={String(summary.delivered)} tone="success" />
          <StatCard label="Issues" value={String(summary.issues)} tone="danger" />
        </div>

        <SectionCard>
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by reference, client, route, driver, or vehicle"
                className="w-full rounded-2xl border border-stone-300 bg-white px-11 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter((event.target.value || '') as Mission['status'] | '')}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
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
        </SectionCard>

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
                  void Promise.all([missionsQuery.refetch(), clientsQuery.refetch()])
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
                : 'Adjust the filters to reveal another mission.'
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
            {filteredMissions.map((mission) => (
              <SectionCard key={mission.mission_id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                        {mission.reference}
                      </h2>
                      <StatusBadge
                        label={mission.status.replace('_', ' ')}
                        tone={missionTone(mission.status)}
                      />
                    </div>
                    <p className="mt-2 text-sm text-stone-500">
                      {clientNameById.get(mission.client_id) ?? 'Unknown client'}
                    </p>
                  </div>

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

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Route</p>
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {mission.departure_location} to {mission.arrival_location}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Departure</p>
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {formatDateTime(mission.departure_datetime)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Assignment</p>
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {mission.driver_name || 'No driver'}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {mission.vehicle_name || 'No vehicle'}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Margin view</p>
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {formatCurrencyWithDecimals(mission.revenue_amount)}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      Est. cost {formatCurrencyWithDecimals(mission.estimated_cost_amount)}
                    </p>
                  </div>
                </div>

                {mission.notes ? (
                  <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Notes</p>
                    <p className="mt-2 text-sm leading-7 text-stone-600">{mission.notes}</p>
                  </div>
                ) : null}
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
