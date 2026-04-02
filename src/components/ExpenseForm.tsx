import { useState } from 'react'
import type { CreateExpenseInput } from '../lib/api/expenses'
import type { Expense, Mission } from '../types/domain'
import { SelectInput } from './SelectInput'
import { TextInput } from './TextInput'

interface ExpenseFormProps {
  missions: Mission[]
  expense?: Expense
  onSave: (data: CreateExpenseInput) => void
  onCancel: () => void
  isLoading?: boolean
}

const today = new Date().toISOString().slice(0, 10)

const expenseTypeOptions: Array<{
  value: Expense['expense_type']
  label: string
}> = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'tolls', label: 'Tolls' },
  { value: 'mission', label: 'Mission' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
]

const approvalStatusOptions: Array<{
  value: Expense['approval_status']
  label: string
}> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
]

function getInitialFormData(expense?: Expense): CreateExpenseInput {
  return {
    mission_id: expense?.mission_id,
    driver_name: expense?.driver_name,
    vehicle_name: expense?.vehicle_name,
    expense_type: expense?.expense_type ?? 'fuel',
    amount: expense?.amount ?? 0,
    advanced_by_driver: expense?.advanced_by_driver ?? false,
    approval_status: expense?.approval_status ?? 'pending',
    receipt_url: expense?.receipt_url,
    receipt_present: expense?.receipt_present ?? false,
    expense_date: expense?.expense_date ?? today,
    notes: expense?.notes ?? '',
  }
}

export function ExpenseForm({
  missions,
  expense,
  onSave,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState<CreateExpenseInput>(() =>
    getInitialFormData(expense)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const missionOptions = missions.map((mission) => ({
    value: mission.mission_id,
    label: `${mission.reference} • ${mission.departure_location} → ${mission.arrival_location}`,
  }))

  const handleChange = <K extends keyof CreateExpenseInput>(
    field: K,
    value: CreateExpenseInput[K]
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
    const nextErrors: Record<string, string> = {}

    if (!formData.expense_date) {
      nextErrors.expense_date = 'Date is required'
    }

    if (!formData.expense_type) {
      nextErrors.expense_type = 'Type is required'
    }

    if (formData.amount <= 0) {
      nextErrors.amount = 'Amount must be greater than 0'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    onSave({
      ...formData,
      driver_name: formData.driver_name?.trim() || undefined,
      vehicle_name: formData.vehicle_name?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      receipt_url: formData.receipt_url?.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Expense info</h3>
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Date"
            type="date"
            value={formData.expense_date}
            onChange={(event) => handleChange('expense_date', event.target.value)}
            max={today}
            error={errors.expense_date}
          />
          <SelectInput
            label="Type"
            options={expenseTypeOptions}
            value={formData.expense_type}
            onChange={(event) =>
              handleChange('expense_type', event.target.value as Expense['expense_type'])
            }
            error={errors.expense_type}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Amount</h3>
        <TextInput
          label="Amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(event) =>
            handleChange(
              'amount',
              event.target.value === '' ? 0 : Number(event.target.value)
            )
          }
          error={errors.amount}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Assignment</h3>
        <SelectInput
          label="Mission"
          options={[{ value: '', label: 'None' }, ...missionOptions]}
          value={formData.mission_id ?? ''}
          onChange={(event) => handleChange('mission_id', event.target.value || undefined)}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Driver"
            value={formData.driver_name ?? ''}
            onChange={(event) => handleChange('driver_name', event.target.value)}
          />
          <TextInput
            label="Vehicle"
            value={formData.vehicle_name ?? ''}
            onChange={(event) => handleChange('vehicle_name', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Approval</h3>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.advanced_by_driver}
            onChange={(event) =>
              handleChange('advanced_by_driver', event.target.checked)
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Advanced by driver</span>
        </label>
        <SelectInput
          label="Approval status"
          options={approvalStatusOptions}
          value={formData.approval_status}
          onChange={(event) =>
            handleChange(
              'approval_status',
              event.target.value as Expense['approval_status']
            )
          }
        />
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.receipt_present}
            onChange={(event) => handleChange('receipt_present', event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Receipt present</span>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900">Notes</label>
        <textarea
          value={formData.notes ?? ''}
          onChange={(event) => handleChange('notes', event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : expense ? 'Save changes' : 'Create expense'}
        </button>
      </div>
    </form>
  )
}
