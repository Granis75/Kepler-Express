import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { VehicleForm } from '../components/VehicleForm'
import type { CreateVehicleInput } from '../types'
import { createVehicle } from '../lib/data'

export function VehicleCreate() {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSubmit = async (data: CreateVehicleInput) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      const vehicle = await createVehicle(data)
      navigate(`/vehicles/${vehicle.vehicle_id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to create the vehicle.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer>
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/vehicles')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <PageHeader
          title="Create Vehicle"
          description="Add a vehicle with service tracking ready from day one."
        />
      </div>

      {saveError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <VehicleForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/vehicles')}
        submitLabel="Create vehicle"
        isLoading={isSaving}
      />
    </PageContainer>
  )
}
