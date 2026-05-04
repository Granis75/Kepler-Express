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
    registration_number: vehicle?.registration_number ?? '',
    vehicle_type: vehicle?.vehicle_type ?? VehicleType.Van,
    status: vehicle?.status ?? VehicleStatus.Active,
    mileage_current: vehicle?.mileage_current ?? 0,
    next_service_mileage: vehicle?.next_service_mileage ?? 0,
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
        registration_number: formData.registration_number,
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
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950">
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
          <TextInput
            label="Registration Number"
            value={formData.registration_number}
            onChange={(e) => handleChange('registration_number', e.target.value)}
            error={errors.registration_number}
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

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950">
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

      <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-[#f7f9fb]/95 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
