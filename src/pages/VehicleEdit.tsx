import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { VehicleForm } from '../components/VehicleForm'
import type { CreateVehicleInput } from '../types'
import {
  getVehicleById,
  updateVehicle,
  useAsyncData,
} from '../lib/data'

export function VehicleEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadVehicle = useCallback(async () => {
    if (!id) {
      throw new Error('Vehicle ID is required.')
    }

    return getVehicleById(id)
  }, [id])

  const { data: vehicle, loading, error, reload } = useAsyncData(loadVehicle, [id])

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading vehicle...</p>
        </div>
      </PageContainer>
    )
  }

  if (error || !vehicle) {
    return (
      <PageContainer>
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error || 'Unable to load the vehicle.'}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageContainer>
    )
  }

  const handleSubmit = async (data: CreateVehicleInput) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      const updatedVehicle = await updateVehicle(vehicle.vehicle_id, data, vehicle)
      navigate(`/vehicles/${updatedVehicle.vehicle_id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to update the vehicle.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer>
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(`/vehicles/${vehicle.vehicle_id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <PageHeader title="Edit Vehicle" description={vehicle.name} />
      </div>

      {saveError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <VehicleForm
        initialData={vehicle}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/vehicles/${vehicle.vehicle_id}`)}
        submitLabel="Save changes"
        isLoading={isSaving}
      />
    </PageContainer>
  )
}
