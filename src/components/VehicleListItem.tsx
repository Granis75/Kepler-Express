import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { Vehicle } from '../types'
import {
  getVehicleServiceAlert,
  getVehicleStatusConfig,
  getVehicleTypeLabel,
} from '../lib/domain'
import { formatMileage } from '../lib/utils'

interface VehicleListItemProps {
  vehicle: Vehicle
  activeMissionReference?: string
  activeMissionCount: number
  onClick?: () => void
}

export function VehicleListItem({
  vehicle,
  activeMissionReference,
  activeMissionCount,
  onClick,
}: VehicleListItemProps) {
  const statusConfig = getVehicleStatusConfig(vehicle.status)
  const serviceAlert = getVehicleServiceAlert(
    vehicle.mileage_current,
    vehicle.next_service_mileage
  )
  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-gray-900">{vehicle.name}</p>
          <span
            className={`inline-flex text-xs font-medium px-2 py-0.5 rounded border ${statusConfig.color}`}
          >
            {statusConfig.label}
          </span>
          <span
            className={`inline-flex text-xs font-medium px-2 py-0.5 rounded border ${serviceAlert.surface} ${serviceAlert.text}`}
          >
            {serviceAlert.label}
          </span>
        </div>
        <p className="text-xs text-gray-600">
          {vehicle.license_plate} • {getVehicleTypeLabel(vehicle.vehicle_type)}
        </p>
        <p className={`text-xs mt-2 ${serviceAlert.text}`}>{serviceAlert.detail}</p>
        {activeMissionReference && (
          <p className="text-xs text-gray-500 mt-2">
            Active mission: {activeMissionReference}
          </p>
        )}
        {!activeMissionReference && activeMissionCount > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {activeMissionCount} active assignments
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 ml-2">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatMileage(vehicle.mileage_current)}
          </p>
          <p className="text-xs text-gray-500">
            Next service {formatMileage(vehicle.next_service_mileage)}
          </p>
        </div>
        {onClick && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
      </div>
    </div>
  )

  if (!onClick) {
    return (
      <div className={clsx('rounded-lg border p-4', serviceAlert.surface)}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-full text-left rounded-lg border p-4 transition-all duration-150',
        serviceAlert.surface,
        'hover:shadow-md'
      )}
    >
      {content}
    </button>
  )
}
