import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { MissionForm, type MissionFormInput } from '../components/MissionForm'
import { useAuthState } from '../lib/auth'
import { useCreateMission } from '../lib/hooks'
import { listClients, listDrivers, listVehicles, useAsyncData } from '../lib/data'

export function MissionCreate() {
  const navigate = useNavigate()
  const { authReady, user } = useAuthState()
  const canLoadProtectedData = authReady && Boolean(user)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load dependencies
  const loadDependencies = useCallback(
    () => Promise.all([listClients(), listDrivers(), listVehicles()]),
    []
  )
  const { data, loading, error, reload } = useAsyncData(loadDependencies, [], {
    enabled: canLoadProtectedData,
  })

  const clients = data?.[0] ?? []
  const drivers = data?.[1] ?? []
  const vehicles = data?.[2] ?? []

  const createMissionMutation = useCreateMission()

  const handleSubmit = async (mission: MissionFormInput) => {
    setSaveError(null)

    try {
      const createdMission = await createMissionMutation.mutateAsync(mission)
      navigate(`/missions/${createdMission.mission_id}`)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to create the mission.')
    }
  }

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
      ) : clients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-900">No clients yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            Create your first client before opening a mission.
          </p>
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to clients
          </button>
        </div>
      ) : (
        <>
          {saveError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}
          <MissionForm
            clients={clients}
            drivers={drivers}
            vehicles={vehicles}
            onSubmit={handleSubmit}
            isLoading={createMissionMutation.isPending}
          />
        </>
      )}
    </PageContainer>
  )
}
