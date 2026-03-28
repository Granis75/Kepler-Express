import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'

export interface ExpenseListItemProps {
  id: string
  mission: string
  category: string
  amount: number
  driver: string
  status: 'pending' | 'reimbursed' | 'disputed'
  advancedByDriver: boolean
  onClick?: () => void
}

const statusStyles = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  reimbursed: 'bg-green-50 text-green-700 border-green-200',
  disputed: 'bg-red-50 text-red-700 border-red-200',
}

export function ExpenseListItem({
  mission,
  category,
  amount,
  driver,
  status,
  advancedByDriver,
  onClick,
}: ExpenseListItemProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-100',
        onClick && 'cursor-pointer'
      )}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-900">{category}</p>
            {advancedByDriver && (
              <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Driver Advance
              </span>
            )}
            <span
              className={clsx(
                'inline-flex text-xs font-medium px-2 py-0.5 rounded border',
                statusStyles[status]
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-gray-600 truncate">
            {mission} • {driver}
          </p>
        </div>
        <div className="flex items-center gap-3 ml-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">€{amount.toFixed(2)}</p>
          </div>
          {onClick && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
        </div>
      </div>
    </button>
  )
}
