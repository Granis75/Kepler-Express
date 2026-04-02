import { useState } from 'react'
import type { Client, Mission } from '../types/domain'
import { MissionStatus } from '../types/enums'
import { SelectInput } from './SelectInput'
import { TextInput } from './TextInput'

export interface MissionEditorInput {
  client_id: string
  reference: string
  status: Mission['status']
  driver_name?: string
  vehicle_name?: string
  revenue_amount: number
  estimated_cost_amount: number
  departure_location: string
  arrival_location: string
  departure_datetime: string
  arrival_datetime?: string
  notes?: string
}

interface MissionEditorFormProps {
  clients: Client[]
  initialData?: Mission
  onSubmit: (data: MissionEditorInput) => void
  onCancel: () => void
  isLoading?: boolean
}

function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16)
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function getInitialState(initialData?: Mission): MissionEditorInput {
  return {
    client_id: initialData?.client_id ?? '',
    reference: initialData?.reference ?? '',
    status: initialData?.status ?? MissionStatus.Planned,
    driver_name: initialData?.driver_name ?? '',
    vehicle_name: initialData?.vehicle_name ?? '',
    revenue_amount: initialData?.revenue_amount ?? 0,
    estimated_cost_amount: initialData?.estimated_cost_amount ?? 0,
    departure_location: initialData?.departure_location ?? '',
    arrival_location: initialData?.arrival_location ?? '',
    departure_datetime: toDateTimeLocalValue(initialData?.departure_datetime),
    arrival_datetime: toDateTimeLocalValue(initialData?.arrival_datetime),
    notes: initialData?.notes ?? '',
  }
}

const statusOptions = [
  { value: MissionStatus.Planned, label: 'Planned' },
  { value: MissionStatus.Assigned, label: 'Assigned' },
  { value: MissionStatus.InProgress, label: 'In progress' },
  { value: MissionStatus.Delivered, label: 'Delivered' },
  { value: MissionStatus.Issue, label: 'Issue' },
  { value: MissionStatus.Cancelled, label: 'Cancelled' },
]

export function MissionEditorForm({
  clients,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: MissionEditorFormProps) {
  const [formData, setFormData] = useState<MissionEditorInput>(() =>
    getInitialState(initialData)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const clientOptions = clients.map((client) => ({
    value: client.client_id,
    label: client.name,
  }))

  const handleChange = <K extends keyof MissionEditorInput>(
    field: K,
    value: MissionEditorInput[K]
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: '',
      }))
    }
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    const departureLocation = formData.departure_location.trim()
    const arrivalLocation = formData.arrival_location.trim()
    const departureDate = formData.departure_datetime
      ? new Date(formData.departure_datetime)
      : null
    const arrivalDate = formData.arrival_datetime ? new Date(formData.arrival_datetime) : null

    if (!formData.reference.trim()) {
      nextErrors.reference = 'Reference is required.'
    }

    if (!formData.client_id) {
      nextErrors.client_id = 'Client is required.'
    }

    if (!departureLocation) {
      nextErrors.departure_location = 'Departure location is required.'
    }

    if (!arrivalLocation) {
      nextErrors.arrival_location = 'Arrival location is required.'
    }

    if (
      departureLocation &&
      arrivalLocation &&
      departureLocation.toLowerCase() === arrivalLocation.toLowerCase()
    ) {
      nextErrors.arrival_location = 'Arrival must be different from departure.'
    }

    if (!formData.departure_datetime || !departureDate || Number.isNaN(departureDate.getTime())) {
      nextErrors.departure_datetime = 'Valid departure date and time is required.'
    }

    if (arrivalDate && departureDate && arrivalDate.getTime() < departureDate.getTime()) {
      nextErrors.arrival_datetime = 'Arrival cannot be earlier than departure.'
    }

    if (formData.revenue_amount < 50 || formData.revenue_amount > 10000) {
      nextErrors.revenue_amount = 'Revenue must be between 50 and 10,000.'
    }

    if (formData.estimated_cost_amount < 0) {
      nextErrors.estimated_cost_amount = 'Estimated cost cannot be negative.'
    }

    if (formData.estimated_cost_amount > formData.revenue_amount) {
      nextErrors.estimated_cost_amount = 'Estimated cost cannot exceed revenue.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    onSubmit({
      client_id: formData.client_id,
      reference: formData.reference.trim(),
      status: formData.status,
      driver_name: formData.driver_name?.trim() || undefined,
      vehicle_name: formData.vehicle_name?.trim() || undefined,
      revenue_amount: formData.revenue_amount,
      estimated_cost_amount: formData.estimated_cost_amount,
      departure_location: formData.departure_location.trim(),
      arrival_location: formData.arrival_location.trim(),
      departure_datetime: formData.departure_datetime,
      arrival_datetime: formData.arrival_datetime || undefined,
      notes: formData.notes?.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Mission reference"
          value={formData.reference}
          onChange={(event) => handleChange('reference', event.target.value)}
          placeholder="M-202604-001"
          error={errors.reference}
        />
        <SelectInput
          label="Client"
          options={clientOptions}
          value={formData.client_id}
          onChange={(event) => handleChange('client_id', event.target.value)}
          error={errors.client_id}
        />
        <SelectInput
          label="Status"
          options={statusOptions}
          value={formData.status}
          onChange={(event) =>
            handleChange('status', event.target.value as MissionEditorInput['status'])
          }
        />
        <TextInput
          label="Departure"
          type="datetime-local"
          value={formData.departure_datetime}
          onChange={(event) => handleChange('departure_datetime', event.target.value)}
          error={errors.departure_datetime}
        />
        <TextInput
          label="Departure location"
          value={formData.departure_location}
          onChange={(event) => handleChange('departure_location', event.target.value)}
          error={errors.departure_location}
        />
        <TextInput
          label="Arrival location"
          value={formData.arrival_location}
          onChange={(event) => handleChange('arrival_location', event.target.value)}
          error={errors.arrival_location}
        />
        <TextInput
          label="Driver name"
          value={formData.driver_name ?? ''}
          onChange={(event) => handleChange('driver_name', event.target.value)}
          placeholder="Optional"
        />
        <TextInput
          label="Vehicle name"
          value={formData.vehicle_name ?? ''}
          onChange={(event) => handleChange('vehicle_name', event.target.value)}
          placeholder="Optional"
        />
        <TextInput
          label="Revenue amount"
          type="number"
          min="50"
          max="10000"
          step="0.01"
          value={formData.revenue_amount}
          onChange={(event) =>
            handleChange(
              'revenue_amount',
              event.target.value === '' ? 0 : Number(event.target.value)
            )
          }
          error={errors.revenue_amount}
        />
        <TextInput
          label="Estimated cost"
          type="number"
          min="0"
          step="0.01"
          value={formData.estimated_cost_amount}
          onChange={(event) =>
            handleChange(
              'estimated_cost_amount',
              event.target.value === '' ? 0 : Number(event.target.value)
            )
          }
          error={errors.estimated_cost_amount}
        />
        <TextInput
          label="Arrival"
          type="datetime-local"
          value={formData.arrival_datetime ?? ''}
          onChange={(event) => handleChange('arrival_datetime', event.target.value)}
          error={errors.arrival_datetime}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-900">Notes</label>
        <textarea
          value={formData.notes ?? ''}
          onChange={(event) => handleChange('notes', event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Saving mission...' : initialData ? 'Save mission' : 'Create mission'}
        </button>
      </div>
    </form>
  )
}
