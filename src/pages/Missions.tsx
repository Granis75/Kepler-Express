import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { MissionFilter } from '../components/MissionFilter'
import { MissionListItem } from '../components/MissionListItem'
import { MissionListSkeleton } from '../components/MissionListSkeleton'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { useAuthState } from '../lib/auth'
import { getMissionListStatus, isActiveMissionStatus } from '../lib/domain'
import { useClients, useMissions } from '../hooks'
import { toSearchValue } from '../lib/utils'
import { MissionStatus } from '../types'
import type { Client, Mission } from '../types/domain'

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

function getDriverName(driverName?: string) {
  if (!driverName) {
    return 'No driver assigned'
  }

  return driverName
}

export function Missions() {
  const navigate = useNavigate()
  const { authReady, user } = useAuthState()
  const canLoadProtectedData = authReady && Boolean(user)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<MissionStatus | ''>('')

  // Missions via React Query
  const {
    data: missions = [],
    isLoading: missionsLoading,
    isError: missionsError,
    error: missionsQueryError,
    refetch: refetchMissions,
  } = useMissions(canLoadProtectedData)
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsQueryError,
    refetch: refetchClients,
  } = useClients(canLoadProtectedData)

  const loading = missionsLoading || clientsLoading
  const error =
    (missionsError &&
      (missionsQueryError instanceof Error
        ? missionsQueryError.message
        : 'Unable to load missions.')) ||
    (clientsQueryError instanceof Error ? clientsQueryError.message : null)

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
        const driverName = toSearchValue(getDriverName(mission.driver_name))
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
  }, [clients, missions, searchQuery, statusFilter])

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
              onClick={() => {
                void Promise.all([refetchMissions(), refetchClients()])
              }}
              className="px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : filteredMissions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            {missions.length > 0
              ? 'No missions match the current filters.'
              : clients.length === 0
                ? 'No clients yet — add a client before creating missions.'
                : 'No missions yet — create your first mission.'}
          </p>
          {missions.length === 0 && (
            <button
              type="button"
              onClick={() => navigate(clients.length === 0 ? '/clients' : '/missions/new')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {clients.length === 0 ? 'Go to clients' : 'Create mission'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredMissions.map((mission) => (
              <MissionListItem
                key={mission.mission_id}
                reference={mission.reference}
                client={getClientName(clients, mission.client_id)}
                route={`${mission.departure_location} → ${mission.arrival_location}`}
                driver={getDriverName(mission.driver_name)}
                status={getMissionListStatus(mission.status)}
                revenue={mission.revenue_amount}
                onClick={() => navigate(`/missions/${mission.mission_id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
