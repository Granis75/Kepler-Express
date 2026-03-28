import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit2 } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { MissionListItem } from '../components/MissionListItem'
import {
  getVehicleById,
  listClients,
  listDrivers,
  listMaintenanceRecordsByVehicleId,
  listMissions,
  useAsyncData,
} from '../lib/data'
import {
  getMaintenanceTypeConfig,
  getMissionListStatus,
  getVehicleServiceAlert,
  getVehicleStatusConfig,
  getVehicleTypeLabel,
  isActiveMissionStatus,
} from '../lib/domain'
import {
  formatCurrencyWithDecimals,
  formatDate,
  formatMileage,
} from '../lib/utils'

export function VehicleDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const loadVehicleDetailData = useCallback(async () => {
    if (!id) {
      throw new Error('Vehicle ID is required.')
    }

    const [vehicle, maintenanceRecords, missions, clients, drivers] = await Promise.all([
      getVehicleById(id),
      listMaintenanceRecordsByVehicleId(id),
      listMissions(),
      listClients(),
      listDrivers(),
    ])

    return {
      vehicle,
      maintenanceRecords,
      missions,
      clients,
      drivers,
    }
  }, [id])

  const { data, loading, error, reload } = useAsyncData(loadVehicleDetailData, [id])

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading vehicle...</p>
        </div>
      </PageContainer>
    )
  }

  if (error || !data) {
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

  const { vehicle, maintenanceRecords, missions, clients, drivers } = data

  const relatedMissions = [...missions]
    .filter((mission) => mission.vehicle_id === vehicle.vehicle_id)
    .sort((left, right) => {
      const leftActive = isActiveMissionStatus(left.status) ? 0 : 1
      const rightActive = isActiveMissionStatus(right.status) ? 0 : 1

      if (leftActive !== rightActive) {
        return leftActive - rightActive
      }

      return (
        new Date(right.departure_datetime).getTime() -
        new Date(left.departure_datetime).getTime()
      )
    })

  const activeMissions = relatedMissions.filter((mission) =>
    isActiveMissionStatus(mission.status)
  )
  const latestMaintenance = maintenanceRecords[0]
  const totalMaintenanceCost = maintenanceRecords.reduce(
    (sum, record) => sum + record.cost_amount,
    0
  )
  const serviceAlert = getVehicleServiceAlert(
    vehicle.mileage_current,
    vehicle.next_service_mileage
  )
  const statusConfig = getVehicleStatusConfig(vehicle.status)

  const getClientName = (clientId: string) =>
    clients.find((client) => client.client_id === clientId)?.name ?? clientId

  const getDriverName = (driverId?: string) => {
    if (!driverId) {
      return 'No driver assigned'
    }

    return drivers.find((driver) => driver.driver_id === driverId)?.name ?? driverId
  }

  return (
    <PageContainer>
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/vehicles')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-gray-900">{vehicle.name}</h1>
              <span
                className={`inline-flex text-sm font-semibold px-3 py-1 rounded border ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/vehicles/${vehicle.vehicle_id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-900"
        >
          <Edit2 size={16} />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className={`rounded-lg border p-6 ${serviceAlert.surface}`}>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Service alert
          </p>
          <p className={`text-2xl font-semibold ${serviceAlert.text}`}>{serviceAlert.label}</p>
          <p className={`text-sm mt-2 ${serviceAlert.text}`}>{serviceAlert.detail}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Current mileage
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatMileage(vehicle.mileage_current)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Next service at {formatMileage(vehicle.next_service_mileage)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Maintenance cost
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrencyWithDecimals(totalMaintenanceCost)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {maintenanceRecords.length} records logged
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Vehicle info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Plate number
                </p>
                <p className="text-gray-900">{vehicle.license_plate}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Registration number
                </p>
                <p className="text-gray-900">{vehicle.registration_number}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Type
                </p>
                <p className="text-gray-900">{getVehicleTypeLabel(vehicle.vehicle_type)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Current mileage
                </p>
                <p className="text-gray-900">{formatMileage(vehicle.mileage_current)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Next service mileage
                </p>
                <p className="text-gray-900">{formatMileage(vehicle.next_service_mileage)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Last service
                </p>
                <p className="text-gray-900">
                  {latestMaintenance ? formatDate(latestMaintenance.service_date) : 'No record yet'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Assigned missions
            </h2>
            {relatedMissions.length > 0 ? (
              <div className="space-y-3">
                {relatedMissions.map((mission) => (
                  <MissionListItem
                    key={mission.mission_id}
                    reference={mission.reference}
                    client={getClientName(mission.client_id)}
                    route={`${mission.departure_location} → ${mission.arrival_location}`}
                    driver={getDriverName(mission.driver_id)}
                    status={getMissionListStatus(mission.status)}
                    revenue={mission.revenue_amount}
                    onClick={() => navigate(`/missions/${mission.mission_id}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No missions are linked to this vehicle yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Service summary
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Active assignments</span>
                <span className="font-medium text-gray-900">{activeMissions.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Maintenance records</span>
                <span className="font-medium text-gray-900">{maintenanceRecords.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Latest maintenance</span>
                <span className="font-medium text-gray-900">
                  {latestMaintenance ? formatDate(latestMaintenance.service_date) : 'No record yet'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Maintenance history
            </h2>
            {maintenanceRecords.length > 0 ? (
              <div className="space-y-3">
                {maintenanceRecords.map((record) => {
                  const typeConfig = getMaintenanceTypeConfig(record.type)

                  return (
                    <div
                      key={record.maintenance_id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex text-xs font-medium px-2 py-0.5 rounded border ${typeConfig.color}`}
                            >
                              {typeConfig.label}
                            </span>
                            <p className="text-xs text-gray-500">
                              {formatDate(record.service_date)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-900 mt-2">
                            {formatMileage(record.mileage_at_service)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Next service {formatMileage(record.next_service_mileage)}
                          </p>
                          {record.notes && (
                            <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrencyWithDecimals(record.cost_amount, record.currency)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No maintenance records are available for this vehicle yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
