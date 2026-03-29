import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { MissionForm, type MissionFormInput } from '../components/MissionForm'
import {
  listClients,
  listDrivers,
  listVehicles,
  useAsyncData,
} from '../lib/data'
import { useUpdateMission, useMission } from '../lib/hooks'

export function MissionEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">Mission ID is required</p>
        </div>
      </PageContainer>
    )
  }

  // Load mission detail and dependencies
  const {
    data: mission,
    isLoading: missionLoading,
    isError: missionError,
  } = useMission(id)

  const loadDependencies = useCallback(
    () => Promise.all([listClients(), listDrivers(), listVehicles()]),
    []
  )
  const { data, loading: depsLoading, error: depsError, reload } = useAsyncData(loadDependencies, [])

  const clients = data?.[0] ?? []
  const drivers = data?.[1] ?? []
  const vehicles = data?.[2] ?? []

  // Mission update mutation
  const updateMissionMutation = useUpdateMission()

  const handleSubmit = async (updatedMission: MissionFormInput) => {
    updateMissionMutation.mutate(
      { id, input: updatedMission },
      {
        onSuccess: () => {
          navigate(`/missions/${id}`)
        },
      }
    )
  }

  const isLoading = missionLoading || depsLoading
  const hasError = missionError || depsError

  return (
    <PageContainer>
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(`/missions/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <PageHeader
          title="Edit Mission"
          description={mission?.reference || 'Loading...'}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading mission...</p>
        </div>
      ) : hasError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 mb-4">Unable to load mission</p>
          <button
            type="button"
            onClick={reload}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : mission ? (
        <MissionForm
          clients={clients}
          drivers={drivers}
          vehicles={vehicles}
          initialData={mission}
          onSubmit={handleSubmit}
          isLoading={updateMissionMutation.isPending}
        />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700">Mission not found</p>
        </div>
      )}
    </PageContainer>
  )
}
