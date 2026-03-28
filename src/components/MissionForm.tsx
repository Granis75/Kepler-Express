import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput } from './TextInput'
import { SelectInput } from './SelectInput'
import { Mission } from '../types'
import { MissionStatus } from '../types'
import { mockClients, mockDrivers } from '../lib/mockData'
import { getMissionStatusOptions } from '../lib/domain'
import { getStoredVehicles } from '../lib/vehicleStore'

interface MissionFormProps {
  initialData?: Mission
  onSubmit: (data: Partial<Mission>) => void
  isLoading?: boolean
}

export function MissionForm({ initialData, onSubmit, isLoading = false }: MissionFormProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Partial<Mission>>(
    initialData || {
      reference: '',
      client_id: '',
      driver_id: '',
      vehicle_id: '',
      departure_location: '',
      arrival_location: '',
      departure_datetime: '',
      revenue_amount: 0,
      estimated_cost_amount: 0,
      status: MissionStatus.Planned,
      notes: '',
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.reference) newErrors.reference = 'Mission reference is required'
    if (!formData.client_id) newErrors.client_id = 'Client is required'
    if (!formData.departure_location) newErrors.departure_location = 'Pickup location is required'
    if (!formData.arrival_location) newErrors.arrival_location = 'Delivery location is required'
    if (!formData.departure_datetime) newErrors.departure_datetime = 'Date is required'
    if (!formData.revenue_amount || formData.revenue_amount <= 0) newErrors.revenue_amount = 'Valid revenue is required'
    if (!formData.estimated_cost_amount || formData.estimated_cost_amount <= 0) newErrors.estimated_cost_amount = 'Valid estimated cost is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const clientOptions = mockClients.map((c) => ({ value: c.client_id, label: c.name }))
  const driverOptions = mockDrivers.map((d) => ({ value: d.driver_id, label: d.name }))
  const vehicleOptions = getStoredVehicles().map((vehicle) => ({
    value: vehicle.vehicle_id,
    label: vehicle.name,
  }))
  const statusOptions = getMissionStatusOptions()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mission Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Mission Info</h2>
        <div className="space-y-4">
          <TextInput
            label="Mission Reference"
            placeholder="e.g. M-202603-001"
            value={formData.reference || ''}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            error={errors.reference}
          />
          <SelectInput
            label="Client"
            options={clientOptions}
            value={formData.client_id || ''}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            error={errors.client_id}
          />
          <SelectInput
            label="Status"
            options={statusOptions}
            value={formData.status || MissionStatus.Planned}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as MissionStatus })}
          />
        </div>
      </div>

      {/* Route */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Route</h2>
        <div className="space-y-4">
          <TextInput
            label="Pickup Location"
            placeholder="e.g. Paris, 75001"
            value={formData.departure_location || ''}
            onChange={(e) => setFormData({ ...formData, departure_location: e.target.value })}
            error={errors.departure_location}
          />
          <TextInput
            label="Delivery Location"
            placeholder="e.g. Lyon, 69001"
            value={formData.arrival_location || ''}
            onChange={(e) => setFormData({ ...formData, arrival_location: e.target.value })}
            error={errors.arrival_location}
          />
          <TextInput
            label="Mission Date"
            type="datetime-local"
            value={formData.departure_datetime || ''}
            onChange={(e) => setFormData({ ...formData, departure_datetime: e.target.value })}
            error={errors.departure_datetime}
          />
        </div>
      </div>

      {/* Assignment */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Assignment</h2>
        <div className="space-y-4">
          <SelectInput
            label="Driver"
            options={[{ value: '', label: 'None' }, ...driverOptions]}
            value={formData.driver_id || ''}
            onChange={(e) => setFormData({ ...formData, driver_id: e.target.value || undefined })}
          />
          <SelectInput
            label="Vehicle"
            options={[{ value: '', label: 'None' }, ...vehicleOptions]}
            value={formData.vehicle_id || ''}
            onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* Financials */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Financials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Revenue Amount (€)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.revenue_amount || ''}
            onChange={(e) => setFormData({ ...formData, revenue_amount: parseFloat(e.target.value) || 0 })}
            error={errors.revenue_amount}
          />
          <TextInput
            label="Estimated Cost (€)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.estimated_cost_amount || ''}
            onChange={(e) => setFormData({ ...formData, estimated_cost_amount: parseFloat(e.target.value) || 0 })}
            error={errors.estimated_cost_amount}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Notes</h2>
        <textarea
          placeholder="Any additional notes..."
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-0 bg-white py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/missions')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Mission'}
        </button>
      </div>
    </form>
  )
}
