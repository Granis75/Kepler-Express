import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Plus, Search } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { VehicleListItem } from '../components/VehicleListItem'
import { SelectInput } from '../components/SelectInput'
import { listMissions, listVehicles, useAsyncData } from '../lib/data'
import {
  getVehicleServiceAlert,
  getVehicleStatusOptions,
  isActiveMissionStatus,
} from '../lib/domain'
import { toSearchValue } from '../lib/utils'
import { VehicleStatus } from '../types'

export function Vehicles() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('')

  const loadVehicleData = useCallback(
    () => Promise.all([listVehicles(), listMissions()]),
    []
  )
  const { data, loading, error, reload } = useAsyncData(loadVehicleData, [])

  const vehicles = data?.[0] ?? []
  const missions = data?.[1] ?? []
  const statusOptions = getVehicleStatusOptions()

  const vehiclesWithContext = useMemo(() => {
    return vehicles
      .map((vehicle) => {
        const serviceAlert = getVehicleServiceAlert(
          vehicle.mileage_current,
          vehicle.next_service_mileage
        )
        const activeMissions = missions.filter(
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
  }, [missions, vehicles])

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return vehiclesWithContext.filter(({ vehicle }) => {
      const matchesStatus = !statusFilter || vehicle.status === statusFilter
      const matchesSearch =
        !query ||
        toSearchValue(vehicle.name).includes(query) ||
        toSearchValue(vehicle.license_plate).includes(query) ||
        toSearchValue(vehicle.registration_number).includes(query)

      return matchesStatus && matchesSearch
    })
  }, [searchQuery, statusFilter, vehiclesWithContext])

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
            Add vehicle
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
              Maintenance alerts
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
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by vehicle, plate number, or registration"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <SelectInput
            label="Status"
            options={[{ value: '', label: 'All statuses' }, ...statusOptions]}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter((event.target.value || '') as VehicleStatus | '')
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Loading vehicles...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredVehicles.length > 0 ? (
        <div className="space-y-3">
          {filteredVehicles.map(({ vehicle, activeMissions }) => (
            <VehicleListItem
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              activeMissionCount={activeMissions.length}
              activeMissionReference={activeMissions[0]?.reference}
              onClick={() => navigate(`/vehicles/${vehicle.vehicle_id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            {vehicles.length > 0
              ? 'No vehicles match the current filters.'
              : 'No vehicles found in Supabase yet.'}
          </p>
        </div>
      )}
    </PageContainer>
  )
}
