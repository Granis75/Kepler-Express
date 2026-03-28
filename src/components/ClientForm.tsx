import { useState } from 'react'
import type { Client, CreateClientInput } from '../types'
import { ClientStatus } from '../types'
import { getClientStatusOptions } from '../lib/domain'
import { validateClientCreation } from '../lib/validators'
import { SelectInput } from './SelectInput'
import { TextInput } from './TextInput'

interface ClientFormProps {
  initialData?: Client
  onSubmit: (data: CreateClientInput) => void
  onCancel: () => void
  submitLabel?: string
  isLoading?: boolean
}

function getInitialFormData(client?: Client): CreateClientInput {
  return {
    name: client?.name ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    address: client?.address ?? '',
    city: client?.city ?? '',
    postal_code: client?.postal_code ?? '',
    country: client?.country ?? 'FR',
    vat_number: client?.vat_number,
    status: client?.status ?? ClientStatus.Active,
    notes: client?.notes ?? '',
  }
}

export function ClientForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save client',
  isLoading = false,
}: ClientFormProps) {
  const [formData, setFormData] = useState<CreateClientInput>(() =>
    getInitialFormData(initialData)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = <K extends keyof CreateClientInput>(
    field: K,
    value: CreateClientInput[K]
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
      validateClientCreation({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        country: formData.country,
      }).errors.map((error) => [error.field, error.message])
    ) as Record<string, string>

    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    onSubmit({
      ...formData,
      vat_number: formData.vat_number?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      status: formData.status ?? ClientStatus.Active,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Client Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Name"
            value={formData.name}
            onChange={(event) => handleChange('name', event.target.value)}
            error={errors.name}
          />
          <SelectInput
            label="Status"
            options={getClientStatusOptions()}
            value={formData.status ?? ClientStatus.Active}
            onChange={(event) =>
              handleChange('status', event.target.value as ClientStatus)
            }
          />
          <TextInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(event) => handleChange('email', event.target.value)}
            error={errors.email}
          />
          <TextInput
            label="Phone"
            value={formData.phone}
            onChange={(event) => handleChange('phone', event.target.value)}
            error={errors.phone}
          />
          <TextInput
            label="Address"
            value={formData.address}
            onChange={(event) => handleChange('address', event.target.value)}
            error={errors.address}
          />
          <TextInput
            label="City"
            value={formData.city}
            onChange={(event) => handleChange('city', event.target.value)}
            error={errors.city}
          />
          <TextInput
            label="Postal Code"
            value={formData.postal_code}
            onChange={(event) => handleChange('postal_code', event.target.value)}
            error={errors.postal_code}
          />
          <TextInput
            label="Country"
            value={formData.country}
            onChange={(event) => handleChange('country', event.target.value)}
            error={errors.country}
          />
          <TextInput
            label="VAT Number"
            value={formData.vat_number ?? ''}
            onChange={(event) => handleChange('vat_number', event.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Notes
        </h2>
        <textarea
          value={formData.notes ?? ''}
          onChange={(event) => handleChange('notes', event.target.value)}
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
