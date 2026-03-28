import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Plus, Search } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { VehicleListItem } from '../components/VehicleListItem'
import { SelectInput } from '../components/SelectInput'
import { mockMissions } from '../lib/mockData'
import {
  getVehicleServiceAlert,
  getVehicleStatusOptions,
  isActiveMissionStatus,
} from '../lib/domain'
import { getStoredVehicles } from '../lib/vehicleStore'
import { VehicleStatus } from '../types'

export function Vehicles() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('')

  const vehicles = getStoredVehicles()
  const statusOptions = getVehicleStatusOptions()

  const vehiclesWithContext = vehicles
    .map((vehicle) => {
      const serviceAlert = getVehicleServiceAlert(
        vehicle.mileage_current,
        vehicle.next_service_mileage
      )
      const activeMissions = mockMissions.filter(
        (mission) =>
          mission.vehicle_id === vehicle.vehicle_id && isActiveMissionStatus(mission.status)
      )

      return {
        vehicle,
        serviceAlert,
        activeMissions,
      }
    })
    .sort((left, right) => {
      const severityOrder = {
        due: 0,
        critical: 1,
        warning: 2,
        normal: 3,
      }

      const leftSeverity = severityOrder[left.serviceAlert.level]
      const rightSeverity = severityOrder[right.serviceAlert.level]

      if (leftSeverity !== rightSeverity) {
        return leftSeverity - rightSeverity
      }

      return left.vehicle.name.localeCompare(right.vehicle.name)
    })

  const filteredVehicles = vehiclesWithContext.filter(({ vehicle }) => {
    const matchesStatus = !statusFilter || vehicle.status === statusFilter
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query ||
      vehicle.name.toLowerCase().includes(query) ||
      vehicle.license_plate.toLowerCase().includes(query)

    return matchesStatus && matchesSearch
  })

  const alertVehicles = vehiclesWithContext.filter(
    ({ serviceAlert }) => serviceAlert.level !== 'normal'
  )
  const activeAssignmentCount = vehiclesWithContext.reduce(
    (sum, item) => sum + item.activeMissions.length,
    0
  )

  return (
    <PageContainer>
      <PageHeader
        title="Vehicles"
        description="Fleet availability and service planning"
        actions={
          <button
            type="button"
            onClick={() => navigate('/vehicles/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Fleet size</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{vehicles.length}</p>
        </div>
        <div className="bg-white border border-amber-200 bg-amber-50 rounded-lg p-4">
          <p className="text-xs font-medium text-amber-700 uppercase">Service watch</p>
          <p className="text-2xl font-bold text-amber-800 mt-2">{alertVehicles.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Active assignments</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{activeAssignmentCount}</p>
        </div>
      </div>

      {alertVehicles.length > 0 && (
        <div className="mb-6 bg-white border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-red-600" />
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Maintenance Alerts
            </h2>
          </div>
          <div className="space-y-2">
            {alertVehicles.map(({ vehicle, serviceAlert }) => (
              <button
                key={vehicle.vehicle_id}
                type="button"
                onClick={() => navigate(`/vehicles/${vehicle.vehicle_id}`)}
                className="w-full text-left rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                    <p className={`text-xs mt-1 ${serviceAlert.text}`}>{serviceAlert.detail}</p>
                  </div>
                  <span className={`text-xs font-medium ${serviceAlert.text}`}>
                    {serviceAlert.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vehicle or plate number"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <SelectInput
            label="Status"
            options={[{ value: '', label: 'All statuses' }, ...statusOptions]}
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target.value || '') as VehicleStatus | '')}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map(({ vehicle, activeMissions }) => (
            <VehicleListItem
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              activeMissionCount={activeMissions.length}
              activeMissionReference={activeMissions[0]?.reference}
              onClick={() => navigate(`/vehicles/${vehicle.vehicle_id}`)}
            />
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">No vehicles match the current filters.</p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
