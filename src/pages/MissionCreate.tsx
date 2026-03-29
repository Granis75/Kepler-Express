import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { MissionForm, type MissionFormInput } from '../components/MissionForm'
import { useCreateMission } from '../lib/hooks'
import { listClients, listDrivers, listVehicles, useAsyncData } from '../lib/data'

export function MissionCreate() {
  const navigate = useNavigate()

  // Load dependencies  
  const loadDependencies = useCallback(
    () => Promise.all([listClients(), listDrivers(), listVehicles()]),
    []
  )
  const { data, loading, error, reload } = useAsyncData(loadDependencies, [])

  const clients = data?.[0] ?? []
  const drivers = data?.[1] ?? []
  const vehicles = data?.[2] ?? []

  // Mission creation mutation
  const createMissionMutation = useCreateMission()

  const handleSubmit = async (mission: MissionFormInput) => {
    createMissionMutation.mutate(mission, {
      onSuccess: (createdMission) => {
        navigate(`/missions/${createdMission.mission_id}`)
      },
    })
  }

  return (
    <PageContainer>
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/missions')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <PageHeader title="Create Mission" description="Set up a new delivery or transport mission" />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading form options...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 mb-4">Unable to load form options</p>
          <button
            type="button"
            onClick={reload}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <MissionForm
          clients={clients}
          drivers={drivers}
          vehicles={vehicles}
          onSubmit={handleSubmit}
          isLoading={createMissionMutation.isPending}
        />
      )}
    </PageContainer>
  )
}
