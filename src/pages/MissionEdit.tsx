import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { MissionForm, type MissionFormInput } from '../components/MissionForm'
import {
  getMissionById,
  listClients,
  listDrivers,
  listVehicles,
  updateMission,
  useAsyncData,
} from '../lib/data'

export function MissionEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadMissionEditData = useCallback(async () => {
    if (!id) {
      throw new Error('Mission ID is required.')
    }

    const [mission, clients, drivers, vehicles] = await Promise.all([
      getMissionById(id),
      listClients(),
      listDrivers(),
      listVehicles(),
    ])

    return {
      mission,
      clients,
      drivers,
      vehicles,
    }
  }, [id])

  const { data, loading, error, reload } = useAsyncData(loadMissionEditData, [id])

  const handleSubmit = async (mission: MissionFormInput) => {
    if (!id) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const updatedMission = await updateMission(id, mission)
      navigate(`/missions/${updatedMission.mission_id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to update the mission.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer>
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(id ? `/missions/${id}` : '/missions')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <PageHeader title="Edit Mission" description={data?.mission.reference} />
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Loading mission...</p>
        </div>
      ) : error || !data ? (
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error || 'Unable to load the mission.'}</p>
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
            clients={data.clients}
            drivers={data.drivers}
            vehicles={data.vehicles}
            initialData={data.mission}
            onSubmit={handleSubmit}
            isLoading={isSaving}
          />
        </>
      )}
    </PageContainer>
  )
}
