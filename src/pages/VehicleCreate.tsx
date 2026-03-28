import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { VehicleForm } from '../components/VehicleForm'
import type { CreateVehicleInput } from '../types'
import { upsertStoredVehicle } from '../lib/vehicleStore'

export function VehicleCreate() {
  const navigate = useNavigate()

  const handleSubmit = (data: CreateVehicleInput) => {
    const vehicle = upsertStoredVehicle(data)
    navigate(`/vehicles/${vehicle.vehicle_id}`)
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

      <VehicleForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/vehicles')}
        submitLabel="Create vehicle"
      />
    </PageContainer>
  )
}
