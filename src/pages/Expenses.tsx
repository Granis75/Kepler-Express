import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import clsx from 'clsx'
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom'
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
import { mergeSearchParams } from '../lib/operations'
import { formatCurrencyWithDecimals, formatDate, toSearchValue } from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'
import { useExpenses, useMissions } from '../hooks'
import { appRoutes } from '../lib/routes'
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

const expenseQueueOptions = [
  { value: 'all', label: 'All expenses' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'missing-receipt', label: 'Missing receipt' },
  { value: 'driver-advance', label: 'Driver advances' },
  { value: 'paid', label: 'Paid expenses' },
] as const

export function Expenses() {
  const navigate = useNavigate()
  const { organization } = useWorkspaceState()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const expensesQuery = useExpenses()
  const missionsQuery = useMissions()

  const expenses = expensesQuery.data ?? []
  const missions = missionsQuery.data ?? []
  const isLoading = expensesQuery.isLoading || missionsQuery.isLoading
  const error =
    (expensesQuery.error instanceof Error && expensesQuery.error.message) ||
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    null

  const queue = searchParams.get('queue') ?? 'all'
  const searchQuery = searchParams.get('q') ?? ''
  const expenseTypeFilter = (searchParams.get('type') ?? '') as Expense['expense_type'] | ''
  const approvalFilter = (searchParams.get('approval') ?? '') as Expense['approval_status'] | ''
  const paidByFilter = (searchParams.get('paidBy') ?? '') as '' | 'driver' | 'company'
  const missionFilter = searchParams.get('mission') ?? ''
  const focusExpenseId = searchParams.get('focus') ?? ''

  const missionReferenceById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission.reference] as const)),
    [missions]
  )

  const missionById = useMemo(
    () => new Map(missions.map((mission) => [mission.mission_id, mission] as const)),
    [missions]
  )

  const filteredExpenses = useMemo(() => {
    const query = toSearchValue(searchQuery)

    return [...expenses]
      .filter((expense) => {
        const missionReference = toSearchValue(
          missionReferenceById.get(expense.mission_id ?? '')
        )
        const driverName = toSearchValue(expense.driver_name)
        const vehicleName = toSearchValue(expense.vehicle_name)
        const notes = toSearchValue(expense.notes)

        const matchesSearch =
          !query ||
          toSearchValue(expense.amount).includes(query) ||
          missionReference.includes(query) ||
          driverName.includes(query) ||
          vehicleName.includes(query) ||
          notes.includes(query)

        const matchesType =
          !expenseTypeFilter || expense.expense_type === expenseTypeFilter
        const matchesApproval =
          !approvalFilter || expense.approval_status === approvalFilter
        const matchesPaidBy =
          !paidByFilter
            ? true
            : paidByFilter === 'driver'
              ? expense.advanced_by_driver
              : !expense.advanced_by_driver
        const matchesMission =
          !missionFilter || expense.mission_id === missionFilter
        const matchesQueue =
          queue === 'all'
            ? true
            : queue === 'pending'
              ? expense.approval_status === 'pending'
              : queue === 'missing-receipt'
                ? !expense.receipt_present
                : queue === 'driver-advance'
                  ? expense.advanced_by_driver
                  : expense.approval_status === 'paid'

        return (
          matchesSearch &&
          matchesType &&
          matchesApproval &&
          matchesPaidBy &&
          matchesMission &&
          matchesQueue
        )
      })
      .sort((left, right) => {
        if (left.expense_id === focusExpenseId) {
          return -1
        }

        if (right.expense_id === focusExpenseId) {
          return 1
        }

        return (
          new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime()
        )
      })
  }, [
    approvalFilter,
    expenseTypeFilter,
    expenses,
    focusExpenseId,
    missionFilter,
    missionReferenceById,
    paidByFilter,
    queue,
    searchQuery,
  ])

  const summary = useMemo(
    () => ({
      totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      driverAdvanced: expenses
        .filter((expense) => expense.advanced_by_driver)
        .reduce((sum, expense) => sum + expense.amount, 0),
      pendingApprovals: expenses.filter((expense) => expense.approval_status === 'pending').length,
      missingReceipts: expenses.filter((expense) => !expense.receipt_present).length,
    }),
    [expenses]
  )

  const closeForm = () => {
    setShowForm(false)
    setSelectedExpense(null)
    setActionError(null)
  }

  const updateFilters = (updates: Record<string, string | null>) => {
    setSearchParams(mergeSearchParams(searchParams, { ...updates, focus: null }), {
      replace: true,
    })
  }

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
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

  const filteredMission = missionFilter ? missionById.get(missionFilter) : null

  return (
    <PageContainer>
      <PageHeader
        title="Expenses"
        description={`Operational cost control for ${organization?.name ?? 'the current workspace'}, with approval, receipt, and mission context kept visible in one queue.`}
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

      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total spend"
            value={formatCurrencyWithDecimals(summary.totalAmount)}
            detail="All recorded expenses"
            onClick={resetFilters}
          />
          <StatCard
            label="Driver advances"
            value={formatCurrencyWithDecimals(summary.driverAdvanced)}
            detail="Out-of-pocket amounts awaiting reimbursement flow"
            tone="warning"
            onClick={() => updateFilters({ queue: 'driver-advance' })}
          />
          <StatCard
            label="Pending approvals"
            value={String(summary.pendingApprovals)}
            detail="Waiting for finance or ops validation"
            tone={summary.pendingApprovals > 0 ? 'warning' : 'default'}
            onClick={() => updateFilters({ queue: 'pending' })}
          />
          <StatCard
            label="Missing receipts"
            value={String(summary.missingReceipts)}
            detail="Cost records still missing proof"
            tone={summary.missingReceipts > 0 ? 'danger' : 'default'}
            onClick={() => updateFilters({ queue: 'missing-receipt' })}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
          <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <SectionCard>
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                  Filters
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Narrow the expense queue around approval, receipt gaps, and mission context.
                </p>
              </div>

              <label className="relative mt-5 block">
                <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => updateFilters({ q: event.target.value || null })}
                  placeholder="Search mission, driver, vehicle, notes, or amount"
                  className="input-shell pl-11"
                />
              </label>

              <div className="mt-5 space-y-2">
                {expenseQueueOptions.map((option) => {
                  const count =
                    option.value === 'pending'
                      ? summary.pendingApprovals
                      : option.value === 'missing-receipt'
                        ? summary.missingReceipts
                        : option.value === 'driver-advance'
                          ? expenses.filter((expense) => expense.advanced_by_driver).length
                          : option.value === 'paid'
                            ? expenses.filter((expense) => expense.approval_status === 'paid').length
                            : expenses.length

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFilters({ queue: option.value === 'all' ? null : option.value })}
                      className={clsx(
                        'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition',
                        queue === option.value || (!queue && option.value === 'all')
                          ? 'border-stone-950 bg-stone-950 text-white shadow-[0_10px_22px_rgba(28,25,23,0.16)]'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                      )}
                    >
                      <span>{option.label}</span>
                      <span>{count}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 space-y-4">
                <select
                  value={expenseTypeFilter}
                  onChange={(event) =>
                    updateFilters({
                      type: (event.target.value || null) as Expense['expense_type'] | null,
                    })
                  }
                  className="input-shell"
                >
                  <option value="">All types</option>
                  {Object.entries(expenseTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={approvalFilter}
                  onChange={(event) =>
                    updateFilters({
                      approval: (event.target.value || null) as Expense['approval_status'] | null,
                    })
                  }
                  className="input-shell"
                >
                  <option value="">All approvals</option>
                  {Object.entries(approvalStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={paidByFilter}
                  onChange={(event) =>
                    updateFilters({
                      paidBy: (event.target.value || null) as 'driver' | 'company' | null,
                    })
                  }
                  className="input-shell"
                >
                  <option value="">All payment sources</option>
                  <option value="driver">Advanced by driver</option>
                  <option value="company">Company paid</option>
                </select>
              </div>

              {filteredMission ? (
                <div className="mt-5 rounded-[1.2rem] border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                    Mission context
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {filteredMission.reference}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Only expenses linked to this mission are visible.
                  </p>
                </div>
              ) : null}

              <button type="button" onClick={resetFilters} className="btn-secondary mt-5 w-full">
                Reset filters
              </button>
            </SectionCard>
          </div>

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
                  : 'Adjust the queue or filters to surface another expense record.'
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
                    onClick={resetFilters}
                    className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                  >
                    Reset filters
                  </button>
                )
              }
            />
          ) : (
            <SectionCard className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Expense queue
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {filteredExpenses.length} visible expense
                    {filteredExpenses.length === 1 ? '' : 's'} with approval state, receipt
                    discipline, and mission linkage kept in one row.
                  </p>
                </div>
                <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
                  {queue === 'all' ? 'All expenses' : `Queue: ${queue.replace('-', ' ')}`}
                </div>
              </div>

              <div className="divide-y divide-stone-200">
                {filteredExpenses.map((expense) => (
                  <article
                    key={expense.expense_id}
                    className={clsx(
                      'grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.1fr)_150px_220px_180px_auto] md:items-start',
                      focusExpenseId === expense.expense_id && 'bg-amber-50/50'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-stone-950">
                          {expenseTypeLabels[expense.expense_type]}
                        </h2>
                        <StatusBadge
                          label={approvalStatusLabels[expense.approval_status]}
                          tone={getApprovalTone(expense.approval_status)}
                        />
                        {!expense.receipt_present ? (
                          <StatusBadge label="receipt missing" tone="danger" />
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                        {expense.mission_id ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate({
                                pathname: appRoutes.missions,
                                search: createSearchParams({
                                  focus: expense.mission_id ?? '',
                                }).toString(),
                              })
                            }
                            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                          >
                            {missionReferenceById.get(expense.mission_id) ?? 'Unknown mission'}
                          </button>
                        ) : (
                          <span>No linked mission</span>
                        )}
                      </div>
                      {expense.notes ? (
                        <p className="mt-2 text-sm text-stone-500">{expense.notes}</p>
                      ) : null}
                    </div>

                    <div className="text-sm text-stone-500">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                        Amount
                      </p>
                      <p className="mt-1 font-medium text-stone-900">
                        {formatCurrencyWithDecimals(expense.amount)}
                      </p>
                      <p className="mt-1">{formatDate(expense.expense_date)}</p>
                    </div>

                    <div className="text-sm text-stone-500">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                        Cost control
                      </p>
                      <p className="mt-1 font-medium text-stone-900">
                        {expense.receipt_present ? 'Receipt present' : 'Receipt missing'}
                      </p>
                      <p className="mt-1">
                        {expense.advanced_by_driver ? 'Advanced by driver' : 'Company paid'}
                      </p>
                    </div>

                    <div className="text-sm text-stone-500">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                        Assignment
                      </p>
                      <p className="mt-1 font-medium text-stone-900">
                        {expense.driver_name || 'No driver'}
                      </p>
                      <p className="mt-1">
                        {expense.vehicle_name || 'No vehicle'}
                      </p>
                    </div>

                    <div className="flex items-start justify-end">
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
                  </article>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
