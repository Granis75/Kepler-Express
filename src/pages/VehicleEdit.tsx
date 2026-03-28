import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { VehicleForm } from '../components/VehicleForm'
import type { CreateVehicleInput } from '../types'
import { getStoredVehicleById, upsertStoredVehicle } from '../lib/vehicleStore'

export function VehicleEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const vehicle = id ? getStoredVehicleById(id) : undefined

  if (!vehicle) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Vehicle not found</p>
        </div>
      </PageContainer>
    )
  }

  const handleSubmit = (data: CreateVehicleInput) => {
    const updatedVehicle = upsertStoredVehicle(data, vehicle)
    navigate(`/vehicles/${updatedVehicle.vehicle_id}`)
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

      <VehicleForm
        initialData={vehicle}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/vehicles/${vehicle.vehicle_id}`)}
        submitLabel="Save changes"
      />
    </PageContainer>
  )
}
