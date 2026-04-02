import { useMemo, useState } from 'react'
import { AlertCircle, ChevronRight, Search } from 'lucide-react'
import { ExpenseForm } from '../components/ExpenseForm'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { SelectInput } from '../components/SelectInput'
import {
  createExpenseRecord,
  type CreateExpenseInput,
  updateExpenseRecord,
} from '../lib/api/expenses'
import { useAuthState } from '../lib/auth'
import { useExpenses, useMissions } from '../hooks'
import { classNames, formatCurrencyWithDecimals, formatDate, toSearchValue } from '../lib/utils'
import type { Expense } from '../types/domain'

const expenseTypeMeta: Record<
  Expense['expense_type'],
  { label: string; color: string }
> = {
  fuel: { label: 'Fuel', color: 'bg-orange-100 text-orange-700' },
  tolls: { label: 'Tolls', color: 'bg-purple-100 text-purple-700' },
  mission: { label: 'Mission', color: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Maintenance', color: 'bg-red-100 text-red-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
}

const approvalStatusMeta: Record<
  Expense['approval_status'],
  { label: string; color: string }
> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
}

const expenseTypeOptions = Object.entries(expenseTypeMeta).map(([value, meta]) => ({
  value: value as Expense['expense_type'],
  label: meta.label,
}))

const approvalStatusOptions = Object.entries(approvalStatusMeta).map(
  ([value, meta]) => ({
    value: value as Expense['approval_status'],
    label: meta.label,
  })
)

export function Expenses() {
  const { authReady, user } = useAuthState()
  const canLoadProtectedData = authReady && Boolean(user)
  const [showForm, setShowForm] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    expenseType: '' as Expense['expense_type'] | '',
    approvalStatus: '' as Expense['approval_status'] | '',
    advancedByDriver: '' as '' | 'yes' | 'no',
    missingReceipt: false,
  })

  const {
    data: expenses = [],
    isLoading: expensesLoading,
    error: expensesQueryError,
    refetch: refetchExpenses,
  } = useExpenses(canLoadProtectedData)
  const {
    data: missions = [],
    isLoading: missionsLoading,
    error: missionsQueryError,
    refetch: refetchMissions,
  } = useMissions(canLoadProtectedData)

  const loading = expensesLoading || missionsLoading
  const error =
    (expensesQueryError instanceof Error && expensesQueryError.message) ||
    (missionsQueryError instanceof Error && missionsQueryError.message) ||
    null

  const missionReferenceById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission.reference] as const)),
    [missions]
  )

  const sortedExpenses = useMemo(() => {
    const searchTerm = toSearchValue(filters.search)

    return [...expenses]
      .filter((expense) => {
        const missionReference = toSearchValue(
          missionReferenceById.get(expense.mission_id ?? '')
        )
        const driverName = toSearchValue(expense.driver_name)
        const vehicleName = toSearchValue(expense.vehicle_name)
        const notes = toSearchValue(expense.notes)

        const matchesSearch =
          !searchTerm ||
          toSearchValue(expense.amount).includes(searchTerm) ||
          missionReference.includes(searchTerm) ||
          driverName.includes(searchTerm) ||
          vehicleName.includes(searchTerm) ||
          notes.includes(searchTerm)

        const matchesType =
          !filters.expenseType || expense.expense_type === filters.expenseType
        const matchesApprovalStatus =
          !filters.approvalStatus || expense.approval_status === filters.approvalStatus
        const matchesDriverAdvance =
          filters.advancedByDriver === ''
            ? true
            : filters.advancedByDriver === 'yes'
              ? expense.advanced_by_driver
              : !expense.advanced_by_driver
        const matchesReceipt = !filters.missingReceipt || !expense.receipt_present

        return (
          matchesSearch &&
          matchesType &&
          matchesApprovalStatus &&
          matchesDriverAdvance &&
          matchesReceipt
        )
      })
      .sort(
        (left, right) =>
          new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime()
      )
  }, [expenses, filters, missionReferenceById])

  const totalAmount = sortedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const driverAdvancedAmount = sortedExpenses
    .filter((expense) => expense.advanced_by_driver)
    .reduce((sum, expense) => sum + expense.amount, 0)
  const missingReceiptCount = sortedExpenses.filter(
    (expense) => !expense.receipt_present
  ).length
  const pendingApprovals = sortedExpenses.filter(
    (expense) => expense.approval_status === 'pending'
  ).length

  const closeForm = () => {
    setShowForm(false)
    setSelectedExpense(null)
    setActionError(null)
  }

  const handleSave = async (expenseData: CreateExpenseInput) => {
    setIsSaving(true)
    setActionError(null)

    try {
      if (selectedExpense) {
        await updateExpenseRecord(selectedExpense.expense_id, expenseData)
      } else {
        await createExpenseRecord(expenseData)
      }

      closeForm()
      await Promise.all([refetchExpenses(), refetchMissions()])
    } catch (saveError) {
      setActionError(
        saveError instanceof Error ? saveError.message : 'Unable to save the expense.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!authReady) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Checking Supabase session...</p>
        </div>
      </PageContainer>
    )
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-amber-200 bg-white p-8 text-center">
          <p className="text-sm text-amber-700">Sign in required to access protected data.</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Expenses"
        description="Track operational costs from live Supabase data"
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedExpense(null)
              setActionError(null)
              setShowForm(true)
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New expense
          </button>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-500">Total expenses</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrencyWithDecimals(totalAmount)}
          </p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-medium uppercase text-orange-600">Driver advances</p>
          <p className="mt-2 text-2xl font-bold text-orange-700">
            {formatCurrencyWithDecimals(driverAdvancedAmount)}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-medium uppercase text-red-600">Missing receipts</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{missingReceiptCount}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase text-amber-600">Pending approvals</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{pendingApprovals}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-lg">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-bold">
                {selectedExpense ? 'Edit expense' : 'New expense'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}
              <ExpenseForm
                missions={missions}
                expense={selectedExpense ?? undefined}
                onSave={handleSave}
                onCancel={closeForm}
                isLoading={isSaving}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Search by amount, notes, mission, driver, or vehicle"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <SelectInput
            label="Type"
            options={[
              { value: '', label: 'All types' },
              ...expenseTypeOptions.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
            value={filters.expenseType}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                expenseType: event.target.value as Expense['expense_type'] | '',
              }))
            }
          />
          <SelectInput
            label="Approval"
            options={[
              { value: '', label: 'All approvals' },
              ...approvalStatusOptions.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
            value={filters.approvalStatus}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                approvalStatus: event.target.value as Expense['approval_status'] | '',
              }))
            }
          />
          <SelectInput
            label="Driver advance"
            options={[
              { value: '', label: 'All expenses' },
              { value: 'yes', label: 'Driver advanced' },
              { value: 'no', label: 'Company paid' },
            ]}
            value={filters.advancedByDriver}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                advancedByDriver: event.target.value as '' | 'yes' | 'no',
              }))
            }
          />
        </div>
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={filters.missingReceipt}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                missingReceipt: event.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Only show missing receipts</span>
        </label>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Loading expenses...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-white p-8 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              void Promise.all([refetchExpenses(), refetchMissions()])
            }}
            className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      ) : sortedExpenses.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            {expenses.length > 0
              ? 'No expenses match the current filters.'
              : 'No expenses found in Supabase yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedExpenses.map((expense) => {
            const typeMeta = expenseTypeMeta[expense.expense_type]
            const approvalMeta = approvalStatusMeta[expense.approval_status]
            const noReceipt = !expense.receipt_present
            const pendingApproval = expense.approval_status === 'pending'

            return (
              <div
                key={expense.expense_id}
                className={classNames(
                  'cursor-pointer rounded-lg border bg-white p-4 transition-shadow hover:shadow-md',
                  noReceipt
                    ? 'border-red-200 bg-red-50'
                    : pendingApproval
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-gray-200'
                )}
                onClick={() => {
                  setSelectedExpense(expense)
                  setActionError(null)
                  setShowForm(true)
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500">
                        {formatDate(expense.expense_date)}
                      </span>
                      <span
                        className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${typeMeta.color}`}
                      >
                        {typeMeta.label}
                      </span>
                      {expense.advanced_by_driver && (
                        <span className="inline-flex rounded bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                          Driver-advanced
                        </span>
                      )}
                    </div>
                    {expense.notes && (
                      <p className="truncate text-sm font-medium text-gray-900">
                        {expense.notes}
                      </p>
                    )}
                    <div
                      className={classNames(
                        'flex items-center gap-4 text-xs text-gray-600',
                        expense.notes && 'mt-2'
                      )}
                    >
                      {expense.mission_id && (
                        <span>
                          Mission:{' '}
                          {missionReferenceById.get(expense.mission_id) ?? expense.mission_id}
                        </span>
                      )}
                      {expense.driver_name && <span>Driver: {expense.driver_name}</span>}
                      {expense.vehicle_name && <span>Vehicle: {expense.vehicle_name}</span>}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrencyWithDecimals(expense.amount)}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded px-2 py-1 text-xs font-semibold ${approvalMeta.color}`}
                      >
                        {approvalMeta.label}
                      </span>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {(noReceipt || pendingApproval) && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2 text-xs">
                      <AlertCircle
                        className={classNames(
                          'h-4 w-4',
                          noReceipt ? 'text-red-600' : 'text-amber-600'
                        )}
                      />
                      <span
                        className={classNames(
                          'font-medium',
                          noReceipt ? 'text-red-700' : 'text-amber-700'
                        )}
                      >
                        {noReceipt ? 'Receipt missing' : 'Waiting for approval'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
