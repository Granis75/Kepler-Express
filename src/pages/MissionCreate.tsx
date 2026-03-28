import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { MissionForm, type MissionFormInput } from '../components/MissionForm'
import {
  createMission,
  listClients,
  listDrivers,
  listVehicles,
  useAsyncData,
} from '../lib/data'

export function MissionCreate() {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadDependencies = useCallback(
    () => Promise.all([listClients(), listDrivers(), listVehicles()]),
    []
  )
  const { data, loading, error, reload } = useAsyncData(loadDependencies, [])

  const handleSubmit = async (mission: MissionFormInput) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      const createdMission = await createMission(mission)
      navigate(`/missions/${createdMission.mission_id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to create the mission.')
    } finally {
      setIsSaving(false)
    }
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
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Loading mission dependencies...</p>
        </div>
      ) : error || !data ? (
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error || 'Unable to load mission dependencies.'}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
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
            clients={data[0]}
            drivers={data[1]}
            vehicles={data[2]}
            onSubmit={handleSubmit}
            isLoading={isSaving}
          />
        </>
      )}
    </PageContainer>
  )
}
