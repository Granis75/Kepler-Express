import { useMemo, useState } from 'react'
import type { Client, Invoice, Mission } from '../types/domain'
import { SelectInput } from './SelectInput'
import { TextInput } from './TextInput'

export interface InvoiceEditorInput {
  client_id: string
  invoice_number: string
  mission_ids: string[]
  amount_total: number
  status: 'draft' | 'sent'
  issue_date: string
  due_date: string
  notes?: string
}

interface InvoiceEditorFormProps {
  clients: Client[]
  missions: Mission[]
  initialData?: Invoice
  onSubmit: (data: InvoiceEditorInput) => void
  onCancel: () => void
  isLoading?: boolean
}

function getDefaultDueDate() {
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + 14)
  return nextDate.toISOString().slice(0, 10)
}

function getInitialState(initialData?: Invoice): InvoiceEditorInput {
  return {
    client_id: initialData?.client_id ?? '',
    invoice_number: initialData?.invoice_number ?? '',
    mission_ids: initialData?.mission_ids ?? [],
    amount_total: initialData?.amount_total ?? 0,
    status: initialData?.status === 'draft' ? 'draft' : 'sent',
    issue_date: initialData?.issue_date ?? new Date().toISOString().slice(0, 10),
    due_date: initialData?.due_date ?? getDefaultDueDate(),
    notes: initialData?.notes ?? '',
  }
}

const workflowStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
] as const

export function InvoiceEditorForm({
  clients,
  missions,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: InvoiceEditorFormProps) {
  const [formData, setFormData] = useState<InvoiceEditorInput>(() =>
    getInitialState(initialData)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const clientOptions = clients.map((client) => ({
    value: client.client_id,
    label: client.name,
  }))

  const availableMissions = useMemo(
    () =>
      missions.filter((mission) =>
        formData.client_id ? mission.client_id === formData.client_id : false
      ),
    [formData.client_id, missions]
  )

  const selectedRevenue = useMemo(
    () =>
      availableMissions
        .filter((mission) => formData.mission_ids.includes(mission.mission_id))
        .reduce((sum, mission) => sum + mission.revenue_amount, 0),
    [availableMissions, formData.mission_ids]
  )

  const handleChange = <K extends keyof InvoiceEditorInput>(
    field: K,
    value: InvoiceEditorInput[K]
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

  const handleClientChange = (clientId: string) => {
    setFormData((current) => ({
      ...current,
      client_id: clientId,
      mission_ids: [],
    }))

    setErrors((current) => ({
      ...current,
      client_id: '',
      mission_ids: '',
    }))
  }

  const toggleMission = (missionId: string) => {
    setFormData((current) => {
      const isSelected = current.mission_ids.includes(missionId)
      const nextMissionIds = isSelected
        ? current.mission_ids.filter((value) => value !== missionId)
        : [...current.mission_ids, missionId]

      const nextTotal =
        current.amount_total > 0 && current.amount_total !== selectedRevenue
          ? current.amount_total
          : availableMissions
              .filter((mission) => nextMissionIds.includes(mission.mission_id))
              .reduce((sum, mission) => sum + mission.revenue_amount, 0)

      return {
        ...current,
        mission_ids: nextMissionIds,
        amount_total: nextTotal,
      }
    })

    if (errors.mission_ids) {
      setErrors((current) => ({
        ...current,
        mission_ids: '',
      }))
    }
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!formData.invoice_number.trim()) {
      nextErrors.invoice_number = 'Invoice number is required.'
    }

    if (!formData.client_id) {
      nextErrors.client_id = 'Client is required.'
    }

    if (formData.mission_ids.length === 0) {
      nextErrors.mission_ids = 'Select at least one mission.'
    }

    if (formData.amount_total < 0) {
      nextErrors.amount_total = 'Amount total cannot be negative.'
    }

    if (!formData.issue_date) {
      nextErrors.issue_date = 'Issue date is required.'
    }

    if (!formData.due_date) {
      nextErrors.due_date = 'Due date is required.'
    }

    if (formData.issue_date && formData.due_date && formData.due_date < formData.issue_date) {
      nextErrors.due_date = 'Due date must be on or after the issue date.'
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
      invoice_number: formData.invoice_number.trim(),
      mission_ids: formData.mission_ids,
      amount_total: formData.amount_total,
      status: formData.status,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      notes: formData.notes?.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {initialData && !['draft', 'sent'].includes(initialData.status) ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This invoice is currently <span className="font-semibold">{initialData.status}</span>.
          Billing states beyond draft and sent are normally driven by payments and due dates.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Invoice number"
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
          label="Workflow status"
          options={workflowStatusOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          value={formData.status}
          onChange={(event) =>
            handleChange('status', event.target.value as InvoiceEditorInput['status'])
          }
        />
        <TextInput
          label="Amount total"
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
        <TextInput
          label="Issue date"
          type="date"
          value={formData.issue_date}
          onChange={(event) => handleChange('issue_date', event.target.value)}
          error={errors.issue_date}
        />
        <TextInput
          label="Due date"
          type="date"
          value={formData.due_date}
          onChange={(event) => handleChange('due_date', event.target.value)}
          error={errors.due_date}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-900">Linked missions</label>
            <p className="mt-1 text-sm text-stone-500">
              Select the missions billed on this invoice.
            </p>
          </div>
          <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            Suggested total {selectedRevenue.toLocaleString('fr-FR')} €
          </div>
        </div>

        <div className="grid gap-3">
          {availableMissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-500">
              Select a client to load missions.
            </div>
          ) : (
            availableMissions.map((mission) => {
              const checked = formData.mission_ids.includes(mission.mission_id)

              return (
                <label
                  key={mission.mission_id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                    checked
                      ? 'border-stone-900 bg-stone-950 text-white'
                      : 'border-stone-200 bg-white text-stone-900 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMission(mission.mission_id)}
                    className="mt-1 h-4 w-4 rounded border-stone-300"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{mission.reference}</p>
                    <p className={checked ? 'text-sm text-stone-300' : 'text-sm text-stone-500'}>
                      {mission.departure_location} to {mission.arrival_location}
                    </p>
                  </div>
                  <div className="ml-auto text-sm font-semibold">
                    {mission.revenue_amount.toLocaleString('fr-FR')} €
                  </div>
                </label>
              )
            })
          )}
        </div>
        {errors.mission_ids ? <p className="mt-2 text-xs text-rose-700">{errors.mission_ids}</p> : null}
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
          {isLoading ? 'Saving invoice...' : initialData ? 'Save invoice' : 'Create invoice'}
        </button>
      </div>
    </form>
  )
}
