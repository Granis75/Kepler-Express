import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { MissionFilter } from '../components/MissionFilter'
import { MissionListItem } from '../components/MissionListItem'
import { MissionListSkeleton } from '../components/MissionListSkeleton'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { useMissions } from '../lib/hooks'
import { listClients, listDrivers, useAsyncData } from '../lib/data'
import { getMissionListStatus, isActiveMissionStatus } from '../lib/domain'
import { toSearchValue } from '../lib/utils'
import { MissionStatus, type Client, type Driver, type Mission } from '../types'

function sortMissions(missions: Mission[]) {
  return [...missions].sort((left, right) => {
    const leftPriority = isActiveMissionStatus(left.status) ? 0 : 1
    const rightPriority = isActiveMissionStatus(right.status) ? 0 : 1

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return (
      new Date(right.departure_datetime).getTime() -
      new Date(left.departure_datetime).getTime()
    )
  })
}

function getClientName(clients: Client[], clientId: string) {
  return clients.find((client) => client.client_id === clientId)?.name ?? clientId
}

function getDriverName(drivers: Driver[], driverId?: string) {
  if (!driverId) {
    return 'No driver assigned'
  }

  return drivers.find((driver) => driver.driver_id === driverId)?.name ?? driverId
}

export function Missions() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<MissionStatus | ''>('')

  // Missions via React Query
  const {
    data: missions = [],
    isLoading: missionsLoading,
    isError: missionsError,
    refetch: refetchMissions,
  } = useMissions()

  // Clients and drivers via old pattern (kept for safety)
  const loadClientDriverData = useCallback(
    () => Promise.all([listClients(), listDrivers()]),
    []
  )
  const { data: clientDriverData, loading: clientDriverLoading, error: clientDriverError, reload: reloadClientDriver } = useAsyncData(loadClientDriverData, [])

  const clients = clientDriverData?.[0] ?? []
  const drivers = clientDriverData?.[1] ?? []

  const loading = missionsLoading || clientDriverLoading
  const error = missionsError ? 'Unable to load missions' : clientDriverError
  const allReady = !loading && !missionsError && !clientDriverError

  const summary = useMemo(() => {
    return missions.reduce(
      (accumulator, mission) => {
        accumulator.total += 1

        if (isActiveMissionStatus(mission.status)) {
          accumulator.active += 1
        }

        if (mission.status === MissionStatus.Delivered) {
          accumulator.delivered += 1
        }

        if (mission.status === MissionStatus.Issue) {
          accumulator.issues += 1
        }

        return accumulator
      },
      {
        total: 0,
        active: 0,
        delivered: 0,
        issues: 0,
      }
    )
  }, [missions])

  const filteredMissions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return sortMissions(
      missions.filter((mission) => {
        const matchesStatus = !statusFilter || mission.status === statusFilter

        if (!normalizedQuery) {
          return matchesStatus
        }

        const reference = toSearchValue(mission.reference)
        const clientName = toSearchValue(getClientName(clients, mission.client_id))
        const driverName = toSearchValue(getDriverName(drivers, mission.driver_id))
        const route = toSearchValue(
          `${mission.departure_location ?? ''} ${mission.arrival_location ?? ''}`
        )

        const matchesSearch =
          reference.includes(normalizedQuery) ||
          clientName.includes(normalizedQuery) ||
          driverName.includes(normalizedQuery) ||
          route.includes(normalizedQuery)

        return matchesStatus && matchesSearch
      })
    )
  }, [clients, drivers, missions, searchQuery, statusFilter])

  return (
    <PageContainer>
      <PageHeader
        title="Missions"
        description="Operational missions synced from Supabase"
        actions={
          <button
            type="button"
            onClick={() => navigate('/missions/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            New mission
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total missions</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.total}</p>
        </div>
        <div className="bg-white border border-blue-200 bg-blue-50 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-700 uppercase">Active</p>
          <p className="text-2xl font-bold text-blue-800 mt-2">{summary.active}</p>
        </div>
        <div className="bg-white border border-green-200 bg-green-50 rounded-lg p-4">
          <p className="text-xs font-medium text-green-700 uppercase">Delivered</p>
          <p className="text-2xl font-bold text-green-800 mt-2">{summary.delivered}</p>
        </div>
        <div className="bg-white border border-red-200 bg-red-50 rounded-lg p-4">
          <p className="text-xs font-medium text-red-700 uppercase">Issues</p>
          <p className="text-2xl font-bold text-red-800 mt-2">{summary.issues}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <MissionFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={(value) => setStatusFilter(value as MissionStatus | '')}
          onClearFilters={() => {
            setSearchQuery('')
            setStatusFilter('')
          }}
        />
      </div>

      {loading ? (
        <MissionListSkeleton />
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => refetchMissions()}
              className="px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              Retry Missions
            </button>
            {clientDriverError && (
              <button
                type="button"
                onClick={reloadClientDriver}
                className="px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                Retry Data
              </button>
            )}
          </div>
        </div>
      ) : filteredMissions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            {missions.length > 0
              ? 'No missions match the current filters.'
              : 'No missions found in Supabase yet. Create your first mission to get started.'}
          </p>
        </div>
      ) : allReady ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredMissions.map((mission) => (
              <MissionListItem
                key={mission.mission_id}
                reference={mission.reference}
                client={getClientName(clients, mission.client_id)}
                route={`${mission.departure_location} → ${mission.arrival_location}`}
                driver={getDriverName(drivers, mission.driver_id)}
                status={getMissionListStatus(mission.status)}
                revenue={mission.revenue_amount}
                onClick={() => navigate(`/missions/${mission.mission_id}`)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </PageContainer>
  )
}
