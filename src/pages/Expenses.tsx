import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { ExpenseFilter } from '../components/ExpenseFilter'
import { ExpenseForm } from '../components/ExpenseForm'
import {
  createExpense,
  listDrivers,
  listExpenses,
  listMissions,
  listVehicles,
  updateExpense,
  useAsyncData,
} from '../lib/data'
import type { CreateExpenseInput, Expense } from '../types/entities'
import { ExpenseType, ReimbursementStatus } from '../types/enums'
import {
  getExpenseTypeConfig,
  getReimbursementStatusConfig,
  isOutstandingReimbursementStatus,
} from '../lib/domain'
import {
  classNames,
  formatCurrency,
  formatDate,
  toFiniteNumber,
  toSearchValue,
} from '../lib/utils'

export function Expenses() {
  const [showForm, setShowForm] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    type: '' as ExpenseType | '',
    reimbursementStatus: '' as ReimbursementStatus | '',
    advancedByDriver: null as boolean | null,
    missingReceipt: false,
  })

  const loadExpenseData = useCallback(
    () => Promise.all([listExpenses(), listMissions(), listDrivers(), listVehicles()]),
    []
  )
  const { data, loading, error, reload } = useAsyncData(loadExpenseData, [])

  const expenses = data?.[0] ?? []
  const missions = data?.[1] ?? []
  const drivers = data?.[2] ?? []
  const vehicles = data?.[3] ?? []

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
        await updateExpense(selectedExpense.expense_id, expenseData)
      } else {
        await createExpense(expenseData)
      }

      closeForm()
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save the expense.')
    } finally {
      setIsSaving(false)
    }
  }

  const missionReferenceById = useMemo(
    () =>
      new Map(
        missions.map((mission) => [mission.mission_id, mission.reference] as const)
      ),
    [missions]
  )

  const driverNameById = useMemo(
    () => new Map(drivers.map((driver) => [driver.driver_id, driver.name] as const)),
    [drivers]
  )

  const vehicleNameById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.vehicle_id, vehicle.name] as const)),
    [vehicles]
  )

  const sortedExpenses = useMemo(() => {
    return [...expenses]
      .filter((expense) => {
        if (filters.search) {
          const searchTerm = toSearchValue(filters.search)
          const missionReference = toSearchValue(
            missionReferenceById.get(expense.mission_id ?? '')
          )
          const driverName = toSearchValue(driverNameById.get(expense.driver_id ?? ''))
          const vehicleName = toSearchValue(vehicleNameById.get(expense.vehicle_id ?? ''))

          const matchesSearch =
            toSearchValue(expense.amount).includes(searchTerm) ||
            toSearchValue(expense.description).includes(searchTerm) ||
            missionReference.includes(searchTerm) ||
            driverName.includes(searchTerm) ||
            vehicleName.includes(searchTerm)

          if (!matchesSearch) {
            return false
          }
        }

        if (filters.type && expense.type !== filters.type) {
          return false
        }

        if (
          filters.reimbursementStatus &&
          expense.reimbursement_status !== filters.reimbursementStatus
        ) {
          return false
        }

        if (
          filters.advancedByDriver !== null &&
          expense.advanced_by_driver !== filters.advancedByDriver
        ) {
          return false
        }

        if (filters.missingReceipt && expense.receipt_attached) {
          return false
        }

        return true
      })
      .sort(
        (left, right) =>
          new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime()
      )
  }, [driverNameById, expenses, filters, missionReferenceById, vehicleNameById])

  const totalAmount = sortedExpenses.reduce(
    (sum, expense) => sum + toFiniteNumber(expense.amount),
    0
  )
  const driverAdvancedAmount = sortedExpenses
    .filter(
      (expense) =>
        expense.advanced_by_driver &&
        isOutstandingReimbursementStatus(expense.reimbursement_status)
    )
    .reduce((sum, expense) => sum + toFiniteNumber(expense.amount), 0)
  const missingReceiptCount = sortedExpenses.filter(
    (expense) => !expense.receipt_attached
  ).length
  const pendingReimbursements = sortedExpenses.filter(
    (expense) =>
      expense.advanced_by_driver &&
      expense.reimbursement_status === ReimbursementStatus.Pending
  ).length

  return (
    <PageContainer>
      <PageHeader
        title="Expenses"
        description="Track operational costs and driver reimbursements"
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedExpense(null)
              setActionError(null)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            New expense
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total expenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-4 bg-orange-50">
          <p className="text-xs font-medium text-orange-600 uppercase">Driver advances due</p>
          <p className="text-2xl font-bold text-orange-700 mt-2">
            {formatCurrency(driverAdvancedAmount)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4 bg-red-50">
          <p className="text-xs font-medium text-red-600 uppercase">Missing receipts</p>
          <p className="text-2xl font-bold text-red-700 mt-2">{missingReceiptCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-amber-200 p-4 bg-amber-50">
          <p className="text-xs font-medium text-amber-600 uppercase">Pending reimbursements</p>
          <p className="text-2xl font-bold text-amber-700 mt-2">{pendingReimbursements}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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
                drivers={drivers}
                vehicles={vehicles}
                expense={selectedExpense ?? undefined}
                onSave={handleSave}
                onCancel={closeForm}
                isLoading={isSaving}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <ExpenseFilter onFilterChange={setFilters} />
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Loading expenses...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : sortedExpenses.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            {expenses.length > 0
              ? 'No expenses match the current filters.'
              : 'No expenses found in Supabase yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedExpenses.map((expense) => {
            const typeConfig = getExpenseTypeConfig(expense.type)
            const statusConfig = getReimbursementStatusConfig(expense.reimbursement_status)
            const isPending =
              expense.advanced_by_driver &&
              expense.reimbursement_status === ReimbursementStatus.Pending
            const noReceipt = !expense.receipt_attached

            return (
              <div
                key={expense.expense_id}
                className={classNames(
                  'bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer',
                  noReceipt
                    ? 'border-red-200 bg-red-50'
                    : isPending
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-gray-200'
                )}
                onClick={() => {
                  setSelectedExpense(expense)
                  setActionError(null)
                  setShowForm(true)
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-medium text-gray-500">
                        {formatDate(expense.expense_date)}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${typeConfig?.color}`}
                      >
                        {typeConfig?.label}
                      </span>
                      {expense.advanced_by_driver && (
                        <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                          Driver-advanced
                        </span>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {expense.description}
                      </p>
                    )}
                    <div
                      className={classNames(
                        'flex items-center gap-4 text-xs text-gray-600',
                        expense.description && 'mt-2'
                      )}
                    >
                      {expense.mission_id && (
                        <span>
                          Mission:{' '}
                          {missionReferenceById.get(expense.mission_id) ?? expense.mission_id}
                        </span>
                      )}
                      {expense.driver_id && (
                        <span>
                          Driver: {driverNameById.get(expense.driver_id) ?? expense.driver_id}
                        </span>
                      )}
                      {expense.vehicle_id && (
                        <span>
                          Vehicle:{' '}
                          {vehicleNameById.get(expense.vehicle_id) ?? expense.vehicle_id}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-semibold mt-1 ${statusConfig?.color}`}
                      >
                        {statusConfig?.label}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                  </div>
                </div>

                {(noReceipt || isPending) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs">
                      <AlertCircle
                        className={classNames(
                          'w-4 h-4',
                          noReceipt ? 'text-red-600' : 'text-orange-600'
                        )}
                      />
                      <span
                        className={classNames(
                          'font-medium',
                          noReceipt ? 'text-red-700' : 'text-orange-700'
                        )}
                      >
                        {noReceipt
                          ? 'Receipt missing'
                          : 'Waiting for reimbursement payment'}
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
