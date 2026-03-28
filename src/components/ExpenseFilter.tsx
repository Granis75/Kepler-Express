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
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by amount, description, mission..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Type filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setExpandedType(!expandedType)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Type {typeFilter && <span className="text-blue-600 font-bold">({getExpenseTypeLabel(typeFilter)})</span>}
            <ChevronDown className="w-4 h-4" />
          </button>
          {expandedType && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-32">
              {Object.values(ExpenseType).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${
                    typeFilter === type ? 'bg-blue-50 text-blue-700 font-medium' : ''
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
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Status {statusFilter && <span className="text-blue-600 font-bold">({getReimbursementStatusLabel(statusFilter)})</span>}
            <ChevronDown className="w-4 h-4" />
          </button>
          {expandedStatus && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-40">
              {Object.values(ReimbursementStatus).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${
                    statusFilter === status ? 'bg-blue-50 text-blue-700 font-medium' : ''
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
              ? 'bg-orange-100 border-orange-300 text-orange-700'
              : 'bg-gray-100 border-gray-300 hover:bg-gray-50'
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
              ? 'bg-red-100 border-red-300 text-red-700'
              : 'bg-gray-100 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Missing receipt {missingReceiptOnly && '⚠'}
        </button>

        {/* Clear button */}
        {(activeFilters > 0 || search) && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
