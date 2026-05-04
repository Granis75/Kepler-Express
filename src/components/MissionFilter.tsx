import { Search, FilterX } from 'lucide-react'
import { getMissionStatusOptions } from '../lib/domain'

interface MissionFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  onClearFilters: () => void
}

export function MissionFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
}: MissionFilterProps) {
  const statusOptions = getMissionStatusOptions()
  const hasFilters = searchQuery || statusFilter

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by mission, client, or route..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-shell py-2 pl-10 pr-4"
        />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="btn-secondary rounded-lg px-3 py-2"
          >
            <FilterX size={16} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
