import { useState } from 'react'
import type { Invoice } from '../types/domain'
import { type CreatePaymentInput } from '../lib/api/payments'
import { TextInput } from './TextInput'
import { SelectInput } from './SelectInput'
import { getPaymentMethodOptions } from '../lib/domain'
import { validatePaymentCreation } from '../lib/validators'
import { formatCurrencyWithDecimals } from '../lib/utils'

interface PaymentFormProps {
  invoice: Invoice
  onSubmit: (data: CreatePaymentInput) => void
  onCancel: () => void
  submitLabel?: string
  isLoading?: boolean
}

interface PaymentFormState {
  amount: number
  payment_date: string
  payment_method: CreatePaymentInput['payment_method']
  notes: string
}

function getInitialFormData(invoice: Invoice): PaymentFormState {
  return {
    amount: Number((invoice.amount_total - invoice.amount_paid).toFixed(2)),
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'bank_transfer',
    notes: '',
  }
}

export function PaymentForm({
  invoice,
  onSubmit,
  onCancel,
  submitLabel = 'Log payment',
  isLoading = false,
}: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormState>(() =>
    getInitialFormData(invoice)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const paymentMethodOptions = getPaymentMethodOptions()
  const remainingAmount = Number((invoice.amount_total - invoice.amount_paid).toFixed(2))

  const handleChange = <K extends keyof PaymentFormState>(
    field: K,
    value: PaymentFormState[K]
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
      validatePaymentCreation({
        amount_total: invoice.amount_total,
        amount_paid: invoice.amount_paid,
        amount: formData.amount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
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
      invoice_id: invoice.invoice_id,
      amount: formData.amount,
      payment_method: formData.payment_method,
      payment_date: formData.payment_date,
      notes: formData.notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-950">Record payment</p>
          <p className="mt-1 text-xs text-slate-500">
            Remaining balance {formatCurrencyWithDecimals(remainingAmount)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput
          label="Amount"
          type="number"
          min="0"
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
        <TextInput
          label="Date"
          type="date"
          value={formData.payment_date}
          onChange={(event) => handleChange('payment_date', event.target.value)}
          error={errors.payment_date}
        />
        <SelectInput
          label="Method"
          options={paymentMethodOptions}
          value={formData.payment_method}
          onChange={(event) =>
            handleChange(
              'payment_method',
              event.target.value as CreatePaymentInput['payment_method']
            )
          }
          error={errors.payment_method}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-950">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(event) => handleChange('notes', event.target.value)}
          rows={3}
          className="input-shell"
        />
      </div>

      <div className="flex gap-3">
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
