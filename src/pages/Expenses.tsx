import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ExpenseForm } from '../components/ExpenseForm'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import {
  ModalSurface,
  PageLoadingSkeleton,
  SectionCard,
  StatePanel,
  StatCard,
  StatusBadge,
} from '../components/WorkspaceUi'
import {
  createExpenseRecord,
  type CreateExpenseInput,
  updateExpenseRecord,
} from '../lib/api/expenses'
import { formatCurrencyWithDecimals, formatDate, toSearchValue } from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'
import { useExpenses, useMissions } from '../hooks'
import type { Expense } from '../types/domain'

const expenseTypeLabels: Record<Expense['expense_type'], string> = {
  fuel: 'Fuel',
  tolls: 'Tolls',
  mission: 'Mission',
  maintenance: 'Maintenance',
  other: 'Other',
}

const approvalStatusLabels: Record<Expense['approval_status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
}

function getApprovalTone(status: Expense['approval_status']) {
  switch (status) {
    case 'paid':
      return 'success' as const
    case 'approved':
      return 'info' as const
    case 'rejected':
      return 'danger' as const
    default:
      return 'warning' as const
  }
}

export function Expenses() {
  const { organization } = useWorkspaceState()
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
  const expensesQuery = useExpenses()
  const missionsQuery = useMissions()

  const expenses = expensesQuery.data ?? []
  const missions = missionsQuery.data ?? []
  const isLoading = expensesQuery.isLoading || missionsQuery.isLoading
  const error =
    (expensesQuery.error instanceof Error && expensesQuery.error.message) ||
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    null

  const missionReferenceById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission.reference] as const)),
    [missions]
  )

  const filteredExpenses = useMemo(() => {
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

        return (
          matchesSearch &&
          matchesType &&
          matchesApprovalStatus &&
          matchesDriverAdvance &&
          (!filters.missingReceipt || !expense.receipt_present)
        )
      })
      .sort(
        (left, right) =>
          new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime()
      )
  }, [expenses, filters, missionReferenceById])

  const summary = useMemo(
    () => ({
      totalAmount: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      driverAdvanced: filteredExpenses
        .filter((expense) => expense.advanced_by_driver)
        .reduce((sum, expense) => sum + expense.amount, 0),
      pendingApprovals: filteredExpenses.filter(
        (expense) => expense.approval_status === 'pending'
      ).length,
      missingReceipts: filteredExpenses.filter((expense) => !expense.receipt_present).length,
    }),
    [filteredExpenses]
  )

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

      toast.success(selectedExpense ? 'Expense updated.' : 'Expense created.')
      closeForm()
      await Promise.all([expensesQuery.refetch(), missionsQuery.refetch()])
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save the expense.'
      setActionError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Expenses"
        description={`Operational costs and receipt discipline for ${organization?.name ?? 'the current workspace'}.`}
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedExpense(null)
              setActionError(null)
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            New expense
          </button>
        }
      />

      {showForm ? (
        <ModalSurface
          title={selectedExpense ? 'Edit expense' : 'Create expense'}
          description="Record only the fields supported by the current expense contract."
          onClose={closeForm}
        >
          {actionError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
          <ExpenseForm
            missions={missions}
            expense={selectedExpense ?? undefined}
            onSave={handleSave}
            onCancel={closeForm}
            isLoading={isSaving}
          />
        </ModalSurface>
      ) : null}

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Visible expenses"
            value={formatCurrencyWithDecimals(summary.totalAmount)}
          />
          <StatCard
            label="Driver advances"
            value={formatCurrencyWithDecimals(summary.driverAdvanced)}
            tone="warning"
          />
          <StatCard
            label="Pending approvals"
            value={String(summary.pendingApprovals)}
            tone={summary.pendingApprovals > 0 ? 'warning' : 'default'}
          />
          <StatCard
            label="Missing receipts"
            value={String(summary.missingReceipts)}
            tone={summary.missingReceipts > 0 ? 'danger' : 'default'}
          />
        </div>

        <SectionCard>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_200px_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                placeholder="Search by mission, driver, vehicle, notes, or amount"
                className="w-full rounded-2xl border border-stone-300 bg-white px-11 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            <select
              value={filters.expenseType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  expenseType: (event.target.value || '') as Expense['expense_type'] | '',
                }))
              }
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
            >
              <option value="">All types</option>
              {Object.entries(expenseTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={filters.approvalStatus}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  approvalStatus: (event.target.value || '') as Expense['approval_status'] | '',
                }))
              }
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
            >
              <option value="">All approvals</option>
              {Object.entries(approvalStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={filters.advancedByDriver}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  advancedByDriver: event.target.value as '' | 'yes' | 'no',
                }))
              }
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
            >
              <option value="">All payments</option>
              <option value="yes">Advanced by driver</option>
              <option value="no">Company paid</option>
            </select>
          </div>

          <label className="mt-4 inline-flex items-center gap-3 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={filters.missingReceipt}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  missingReceipt: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-stone-300"
            />
            Show only expenses missing a receipt
          </label>
        </SectionCard>

        {isLoading ? (
          <PageLoadingSkeleton stats={4} rows={4} />
        ) : error ? (
          <StatePanel
            tone="danger"
            title="Unable to load expenses"
            message={error}
            action={
              <button
                type="button"
                onClick={() => {
                  void Promise.all([expensesQuery.refetch(), missionsQuery.refetch()])
                }}
                className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                Retry
              </button>
            }
          />
        ) : filteredExpenses.length === 0 ? (
          <StatePanel
            title={expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'}
            message={
              expenses.length === 0
                ? 'Create the first expense to start tracking actual mission costs.'
                : 'Adjust the filters to surface another expense record.'
            }
            action={
              expenses.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExpense(null)
                    setShowForm(true)
                  }}
                  className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  Create expense
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      search: '',
                      expenseType: '',
                      approvalStatus: '',
                      advancedByDriver: '',
                      missingReceipt: false,
                    })
                  }
                  className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                >
                  Reset filters
                </button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredExpenses.map((expense) => (
              <SectionCard key={expense.expense_id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                        {expenseTypeLabels[expense.expense_type]}
                      </h2>
                      <StatusBadge
                        label={approvalStatusLabels[expense.approval_status]}
                        tone={getApprovalTone(expense.approval_status)}
                      />
                    </div>
                    <p className="mt-2 text-sm text-stone-500">
                      {missionReferenceById.get(expense.mission_id ?? '') || 'No linked mission'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExpense(expense)
                      setActionError(null)
                      setShowForm(true)
                    }}
                    className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                  >
                    Edit
                  </button>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Amount</p>
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {formatCurrencyWithDecimals(expense.amount)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Date</p>
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {formatDate(expense.expense_date)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Assignment</p>
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {expense.driver_name || 'No driver'}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {expense.vehicle_name || 'No vehicle'}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Receipt</p>
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {expense.receipt_present ? 'Receipt present' : 'Receipt missing'}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {expense.advanced_by_driver ? 'Advanced by driver' : 'Company paid'}
                    </p>
                  </div>
                </div>

                {expense.notes ? (
                  <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Notes</p>
                    <p className="mt-2 text-sm leading-7 text-stone-600">{expense.notes}</p>
                  </div>
                ) : null}
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
