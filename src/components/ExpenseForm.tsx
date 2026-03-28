import { useState } from 'react'
import { Expense, CreateExpenseInput, Driver, Mission, Vehicle } from '../types/entities'
import { ExpenseType, ReimbursementStatus, Currency } from '../types/enums'
import { TextInput } from './TextInput'
import { SelectInput } from './SelectInput'
import { validateExpenseCreation } from '../lib/validators'
import {
  getExpenseTypeLabel,
  getReimbursementStatusLabel,
  normalizeExpenseReimbursementStatus,
} from '../lib/domain'

interface ExpenseFormProps {
  missions: Mission[]
  drivers: Driver[]
  vehicles: Vehicle[]
  expense?: Expense
  onSave: (data: CreateExpenseInput) => void
  onCancel: () => void
  isLoading?: boolean
}

const today = new Date().toISOString().split('T')[0]

function getInitialFormData(expense?: Expense): CreateExpenseInput {
  const advancedByDriver = expense?.advanced_by_driver ?? false

  return {
    expense_date: expense?.expense_date ?? today,
    type: expense?.type ?? ExpenseType.Fuel,
    amount: expense?.amount ?? 0,
    currency: expense?.currency ?? Currency.EUR,
    mission_id: expense?.mission_id,
    driver_id: expense?.driver_id,
    vehicle_id: expense?.vehicle_id,
    advanced_by_driver: advancedByDriver,
    reimbursement_status:
      expense?.reimbursement_status ??
      (advancedByDriver ? ReimbursementStatus.Pending : ReimbursementStatus.Paid),
    receipt_attached: expense?.receipt_attached ?? false,
    description: expense?.description ?? '',
  }
}

export function ExpenseForm({
  missions,
  drivers,
  vehicles,
  expense,
  onSave,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState<CreateExpenseInput>(() => getInitialFormData(expense))

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = <K extends keyof CreateExpenseInput>(field: K, value: CreateExpenseInput[K]) => {
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

  const handleAdvancedByDriverChange = (advancedByDriver: boolean) => {
    setFormData((prev) => ({
      ...prev,
      advanced_by_driver: advancedByDriver,
      reimbursement_status: normalizeExpenseReimbursementStatus(
        advancedByDriver,
        prev.reimbursement_status === ReimbursementStatus.Paid
          ? undefined
          : prev.reimbursement_status
      ),
    }))
  }

  const validate = (data: CreateExpenseInput) => {
    const newErrors = Object.fromEntries(
      validateExpenseCreation({
        amount: data.amount,
        expense_date: data.expense_date,
        receipt_attached: data.receipt_attached,
        advanced_by_driver: data.advanced_by_driver,
      }).errors.map((error) => [error.field, error.message])
    ) as Record<string, string>

    if (!data.type) newErrors.type = 'Type is required'
    if (!data.currency) newErrors.currency = 'Currency is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedFormData: CreateExpenseInput = {
      ...formData,
      reimbursement_status: normalizeExpenseReimbursementStatus(
        formData.advanced_by_driver,
        formData.reimbursement_status
      ),
    }

    if (validate(normalizedFormData)) {
      onSave(normalizedFormData)
    }
  }

  const typeOptions = Object.values(ExpenseType).map((type) => ({
    value: type,
    label: getExpenseTypeLabel(type),
  }))

  const statusOptions = Object.values(ReimbursementStatus).map((status) => ({
    value: status,
    label: getReimbursementStatusLabel(status),
  }))

  const currencyOptions = Object.values(Currency).map((curr) => ({
    value: curr,
    label: curr,
  }))

  const missionOptions = missions.map((m) => ({
    value: m.mission_id,
    label: `${m.reference} • ${m.departure_location} → ${m.arrival_location}`,
  }))

  const driverOptions = drivers.map((d) => ({
    value: d.driver_id,
    label: d.name,
  }))

  const vehicleOptions = vehicles.map((vehicle) => ({
    value: vehicle.vehicle_id,
    label: `${vehicle.name} (${vehicle.license_plate})`,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Expense info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Expense info</h3>
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Date"
            type="date"
            value={formData.expense_date}
            onChange={(e) => handleChange('expense_date', e.target.value)}
            max={today}
            error={errors.expense_date}
          />
          <SelectInput
            label="Type"
            options={typeOptions}
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value as ExpenseType)}
            error={errors.type}
          />
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Amount</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <TextInput
              label="Amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                handleChange('amount', e.target.value === '' ? 0 : Number(e.target.value))
              }
              error={errors.amount}
            />
          </div>
          <SelectInput
            label="Currency"
            options={currencyOptions}
            value={formData.currency || Currency.EUR}
            onChange={(e) => handleChange('currency', e.target.value as Currency)}
            error={errors.currency}
          />
        </div>
      </div>

      {/* Assignment */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Assignment</h3>
        <SelectInput
          label="Mission"
          options={[{ value: '', label: 'None' }, ...missionOptions]}
          value={formData.mission_id || ''}
          onChange={(e) => handleChange('mission_id', e.target.value || undefined)}
        />
        <SelectInput
          label="Driver"
          options={[{ value: '', label: 'None' }, ...driverOptions]}
          value={formData.driver_id || ''}
          onChange={(e) => handleChange('driver_id', e.target.value || undefined)}
        />
        <SelectInput
          label="Vehicle"
          options={[{ value: '', label: 'None' }, ...vehicleOptions]}
          value={formData.vehicle_id || ''}
          onChange={(e) => handleChange('vehicle_id', e.target.value || undefined)}
        />
      </div>

      {/* Reimbursement */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Reimbursement</h3>
        <div className="space-y-4">
          {/* Driver-advanced flag */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.advanced_by_driver}
              onChange={(e) => handleAdvancedByDriverChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Advanced by driver <span className="text-orange-600 font-medium">(reimbursement required)</span>
            </span>
          </label>

          {/* Status */}
          <SelectInput
            label="Reimbursement status"
            options={statusOptions}
            value={
              formData.advanced_by_driver
                ? formData.reimbursement_status || ReimbursementStatus.Pending
                : ReimbursementStatus.Paid
            }
            onChange={(e) =>
              handleChange('reimbursement_status', e.target.value as ReimbursementStatus)
            }
            disabled={!formData.advanced_by_driver}
          />
          {!formData.advanced_by_driver && (
            <p className="text-xs text-gray-500">
              Company-paid expenses are marked as paid automatically.
            </p>
          )}

          {/* Receipt attached */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.receipt_attached}
              onChange={(e) => handleChange('receipt_attached', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Receipt attached</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900">Notes</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add any notes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : expense ? 'Save changes' : 'Create expense'}
        </button>
      </div>
    </form>
  )
}
