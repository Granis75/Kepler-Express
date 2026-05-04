import { useState } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { ExpenseType, ReimbursementStatus } from '../types/enums'
import { getExpenseTypeLabel, getReimbursementStatusLabel } from '../lib/domain'

interface ExpenseFilterProps {
  onFilterChange: (filters: {
    search: string
    type: ExpenseType | ''
    reimbursementStatus: ReimbursementStatus | ''
    advancedByDriver: boolean | null
    missingReceipt: boolean
  }) => void
}

export function ExpenseFilter({ onFilterChange }: ExpenseFilterProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ExpenseType | ''>('')
  const [statusFilter, setStatusFilter] = useState<ReimbursementStatus | ''>('')
  const [advancedFilter, setAdvancedFilter] = useState<boolean | null>(null)
  const [missingReceiptOnly, setMissingReceiptOnly] = useState(false)
  const [expandedType, setExpandedType] = useState(false)
  const [expandedStatus, setExpandedStatus] = useState(false)

  const handleClear = () => {
    setSearch('')
    setTypeFilter('')
    setStatusFilter('')
    setAdvancedFilter(null)
    setMissingReceiptOnly(false)
    onFilterChange({
      search: '',
      type: '',
      reimbursementStatus: '',
      advancedByDriver: null,
      missingReceipt: false,
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFilterChange({
      search: value,
      type: typeFilter,
      reimbursementStatus: statusFilter,
      advancedByDriver: advancedFilter,
      missingReceipt: missingReceiptOnly,
    })
  }

  const handleTypeChange = (type: ExpenseType) => {
    const newType = typeFilter === type ? '' : type
    setTypeFilter(newType)
    setExpandedType(false)
    onFilterChange({
      search,
      type: newType,
      reimbursementStatus: statusFilter,
      advancedByDriver: advancedFilter,
      missingReceipt: missingReceiptOnly,
    })
  }

  const handleStatusChange = (status: ReimbursementStatus) => {
    const newStatus = statusFilter === status ? '' : status
    setStatusFilter(newStatus)
    setExpandedStatus(false)
    onFilterChange({
      search,
      type: typeFilter,
      reimbursementStatus: newStatus,
      advancedByDriver: advancedFilter,
      missingReceipt: missingReceiptOnly,
    })
  }

  const handleAdvancedChange = (value: boolean | null) => {
    const newAdvanced = advancedFilter === value ? null : value
    setAdvancedFilter(newAdvanced)
    onFilterChange({
      search,
      type: typeFilter,
      reimbursementStatus: statusFilter,
      advancedByDriver: newAdvanced,
      missingReceipt: missingReceiptOnly,
    })
  }

  const handleMissingReceiptChange = () => {
    const newValue = !missingReceiptOnly
    setMissingReceiptOnly(newValue)
    onFilterChange({
      search,
      type: typeFilter,
      reimbursementStatus: statusFilter,
      advancedByDriver: advancedFilter,
      missingReceipt: newValue,
    })
  }

  const activeFilters = [typeFilter, statusFilter, advancedFilter !== null, missingReceiptOnly].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by amount, description, mission..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="input-shell py-2 pl-9 pr-3"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Type filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setExpandedType(!expandedType)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Type {typeFilter && <span className="font-bold text-teal-700">({getExpenseTypeLabel(typeFilter)})</span>}
            <ChevronDown className="w-4 h-4" />
          </button>
          {expandedType && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-32 rounded-lg border border-slate-200 bg-white shadow-lg">
              {Object.values(ExpenseType).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                    typeFilter === type ? 'bg-teal-50 font-medium text-teal-700' : ''
                  }`}
                >
                  {getExpenseTypeLabel(type)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setExpandedStatus(!expandedStatus)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Status {statusFilter && <span className="font-bold text-teal-700">({getReimbursementStatusLabel(statusFilter)})</span>}
            <ChevronDown className="w-4 h-4" />
          </button>
          {expandedStatus && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
              {Object.values(ReimbursementStatus).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                    statusFilter === status ? 'bg-teal-50 font-medium text-teal-700' : ''
                  }`}
                >
                  {getReimbursementStatusLabel(status)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Driver-advanced toggle */}
        <button
          type="button"
          onClick={() => handleAdvancedChange(advancedFilter === true ? null : true)}
          className={`px-3 py-2 rounded-lg text-sm font-medium border ${
            advancedFilter === true
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Driver-advanced {advancedFilter === true && '✓'}
        </button>

        {/* Missing receipt toggle */}
        <button
          type="button"
          onClick={() => handleMissingReceiptChange()}
          className={`px-3 py-2 rounded-lg text-sm font-medium border ${
            missingReceiptOnly
              ? 'border-rose-300 bg-rose-50 text-rose-700'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Missing receipt {missingReceiptOnly && '⚠'}
        </button>

        {/* Clear button */}
        {(activeFilters > 0 || search) && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
