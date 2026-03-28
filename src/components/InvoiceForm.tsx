import { useState } from 'react'
import type { CreateInvoiceInput, Invoice } from '../types'
import { InvoiceStatus, MissionStatus } from '../types'
import { TextInput } from './TextInput'
import { SelectInput } from './SelectInput'
import { mockClients, mockMissions } from '../lib/mockData'
import {
  getInvoiceStatusConfig,
  getInvoiceWorkflowStatusOptions,
} from '../lib/domain'
import { validateInvoiceCreation } from '../lib/validators'

interface InvoiceFormProps {
  initialData?: Invoice
  defaultInvoiceNumber?: string
  existingPaidAmount?: number
  onSubmit: (data: CreateInvoiceInput) => void
  onCancel: () => void
  submitLabel?: string
  isLoading?: boolean
}

interface InvoiceFormState {
  invoice_number: string
  client_id: string
  mission_id: string
  issued_date: string
  due_date: string
  amount_total: number
  status: InvoiceStatus
  notes: string
}

function getDefaultDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().slice(0, 10)
}

function getInitialFormData(
  invoice?: Invoice,
  defaultInvoiceNumber?: string,
): InvoiceFormState {
  return {
    invoice_number: invoice?.invoice_number ?? defaultInvoiceNumber ?? '',
    client_id: invoice?.client_id ?? '',
    mission_id: invoice?.mission_ids[0] ?? '',
    issued_date: invoice?.issued_date ?? new Date().toISOString().slice(0, 10),
    due_date: invoice?.due_date ?? getDefaultDueDate(),
    amount_total: invoice?.amount_total ?? 0,
    status: invoice?.status === InvoiceStatus.Draft ? InvoiceStatus.Draft : InvoiceStatus.Sent,
    notes: invoice?.notes ?? '',
  }
}

export function InvoiceForm({
  initialData,
  defaultInvoiceNumber,
  existingPaidAmount = 0,
  onSubmit,
  onCancel,
  submitLabel = 'Save invoice',
  isLoading = false,
}: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormState>(() =>
    getInitialFormData(initialData, defaultInvoiceNumber)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const clientOptions = mockClients.map((client) => ({
    value: client.client_id,
    label: client.name,
  }))

  const missionOptions = mockMissions
    .filter(
      (mission) =>
        (!formData.client_id || mission.client_id === formData.client_id) &&
        mission.status !== MissionStatus.Cancelled
    )
    .map((mission) => ({
      value: mission.mission_id,
      label: `${mission.reference} • ${mission.departure_location} → ${mission.arrival_location}`,
    }))

  const invoiceStatusOptions = existingPaidAmount > 0
    ? getInvoiceWorkflowStatusOptions().filter(
        (option) => option.value !== InvoiceStatus.Draft
      )
    : getInvoiceWorkflowStatusOptions()

  const currentComputedStatus =
    initialData && initialData.status !== InvoiceStatus.Draft && initialData.status !== InvoiceStatus.Sent
      ? getInvoiceStatusConfig(initialData.status)
      : undefined

  const handleChange = <K extends keyof InvoiceFormState>(
    field: K,
    value: InvoiceFormState[K]
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

  const handleClientChange = (clientId: string) => {
    const selectedMission = mockMissions.find(
      (mission) => mission.mission_id === formData.mission_id
    )

    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      mission_id:
        selectedMission && selectedMission.client_id === clientId
          ? prev.mission_id
          : '',
    }))

    if (errors.client_id || errors.mission_ids) {
      setErrors((prev) => ({
        ...prev,
        client_id: '',
        mission_ids: '',
      }))
    }
  }

  const handleMissionChange = (missionId: string) => {
    const selectedMission = mockMissions.find((mission) => mission.mission_id === missionId)

    setFormData((prev) => ({
      ...prev,
      mission_id: missionId,
      amount_total:
        prev.amount_total > 0 || !selectedMission
          ? prev.amount_total
          : selectedMission.revenue_amount,
    }))

    if (errors.mission_ids) {
      setErrors((prev) => ({
        ...prev,
        mission_ids: '',
      }))
    }
  }

  const validate = () => {
    const validationErrors = Object.fromEntries(
      validateInvoiceCreation({
        invoice_number: formData.invoice_number,
        client_id: formData.client_id,
        mission_ids: formData.mission_id ? [formData.mission_id] : [],
        amount_total: formData.amount_total,
        issued_date: formData.issued_date,
        due_date: formData.due_date,
      }).errors.map((error) => [error.field, error.message])
    ) as Record<string, string>

    if (existingPaidAmount > 0 && formData.status === InvoiceStatus.Draft) {
      validationErrors.status = 'Invoices with payments cannot move back to draft'
    }

    if (formData.amount_total < existingPaidAmount) {
      validationErrors.amount_total = 'Invoice amount cannot be lower than payments already received'
    }

    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    onSubmit({
      invoice_number: formData.invoice_number.trim(),
      client_id: formData.client_id,
      mission_ids: formData.mission_id ? [formData.mission_id] : [],
      amount_total: formData.amount_total,
      status: formData.status,
      issued_date: formData.issued_date,
      due_date: formData.due_date,
      notes: formData.notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {currentComputedStatus && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${currentComputedStatus.color}`}>
          Current status is <span className="font-medium">{currentComputedStatus.label}</span>.
          Partial, paid, and overdue states are derived from payments and due dates.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Invoice Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Invoice Number"
            value={formData.invoice_number}
            onChange={(event) => handleChange('invoice_number', event.target.value)}
            error={errors.invoice_number}
          />
          <SelectInput
            label="Client"
            options={clientOptions}
            value={formData.client_id}
            onChange={(event) => handleClientChange(event.target.value)}
            error={errors.client_id}
          />
          <SelectInput
            label="Mission"
            options={missionOptions}
            value={formData.mission_id}
            onChange={(event) => handleMissionChange(event.target.value)}
            error={errors.mission_ids}
          />
          <SelectInput
            label="Status"
            options={invoiceStatusOptions}
            value={formData.status}
            onChange={(event) => handleChange('status', event.target.value as InvoiceStatus)}
            error={errors.status}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Dates & Amount
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextInput
            label="Issue Date"
            type="date"
            value={formData.issued_date}
            onChange={(event) => handleChange('issued_date', event.target.value)}
            error={errors.issued_date}
          />
          <TextInput
            label="Due Date"
            type="date"
            value={formData.due_date}
            onChange={(event) => handleChange('due_date', event.target.value)}
            error={errors.due_date}
          />
          <TextInput
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.amount_total}
            onChange={(event) =>
              handleChange(
                'amount_total',
                event.target.value === '' ? 0 : Number(event.target.value)
              )
            }
            error={errors.amount_total}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Notes
        </h2>
        <textarea
          value={formData.notes}
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
