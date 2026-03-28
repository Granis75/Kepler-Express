import { useState } from 'react'
import type { CreateVehicleInput, Vehicle } from '../types'
import { VehicleStatus, VehicleType } from '../types'
import { TextInput } from './TextInput'
import { SelectInput } from './SelectInput'
import { getVehicleStatusOptions, getVehicleTypeOptions } from '../lib/domain'
import { validateVehicleCreation } from '../lib/validators'

interface VehicleFormProps {
  initialData?: Vehicle
  onSubmit: (data: CreateVehicleInput) => void
  onCancel: () => void
  submitLabel?: string
  isLoading?: boolean
}

function getInitialFormData(vehicle?: Vehicle): CreateVehicleInput {
  return {
    name: vehicle?.name ?? '',
    license_plate: vehicle?.license_plate ?? '',
    registration_number: vehicle?.registration_number,
    vehicle_type: vehicle?.vehicle_type ?? VehicleType.Van,
    status: vehicle?.status ?? VehicleStatus.Active,
    mileage_current: vehicle?.mileage_current ?? 0,
    next_service_mileage: vehicle?.next_service_mileage ?? 0,
    notes: vehicle?.notes ?? '',
  }
}

export function VehicleForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save vehicle',
  isLoading = false,
}: VehicleFormProps) {
  const [formData, setFormData] = useState<CreateVehicleInput>(() =>
    getInitialFormData(initialData)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const vehicleTypeOptions = getVehicleTypeOptions()
  const vehicleStatusOptions = getVehicleStatusOptions()

  const handleChange = <K extends keyof CreateVehicleInput>(
    field: K,
    value: CreateVehicleInput[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const validate = () => {
    const validationErrors = Object.fromEntries(
      validateVehicleCreation({
        name: formData.name,
        license_plate: formData.license_plate,
        mileage_current: formData.mileage_current,
        next_service_mileage: formData.next_service_mileage,
      }).errors.map((error) => [error.field, error.message])
    ) as Record<string, string>

    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (validate()) {
      onSubmit({
        ...formData,
        notes: formData.notes?.trim() || undefined,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Vehicle Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
          />
          <TextInput
            label="Plate Number"
            value={formData.license_plate}
            onChange={(e) => handleChange('license_plate', e.target.value)}
            error={errors.license_plate}
          />
          <SelectInput
            label="Type"
            options={vehicleTypeOptions}
            value={formData.vehicle_type}
            onChange={(e) => handleChange('vehicle_type', e.target.value as CreateVehicleInput['vehicle_type'])}
          />
          <SelectInput
            label="Status"
            options={vehicleStatusOptions}
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as VehicleStatus)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Service Tracking
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Current Mileage"
            type="number"
            min="0"
            step="1"
            value={formData.mileage_current}
            onChange={(e) =>
              handleChange(
                'mileage_current',
                e.target.value === '' ? 0 : Number(e.target.value)
              )
            }
            error={errors.mileage_current}
          />
          <TextInput
            label="Next Service Mileage"
            type="number"
            min="0"
            step="1"
            value={formData.next_service_mileage}
            onChange={(e) =>
              handleChange(
                'next_service_mileage',
                e.target.value === '' ? 0 : Number(e.target.value)
              )
            }
            error={errors.next_service_mileage}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Notes
        </h2>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 sticky bottom-0 bg-white py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
