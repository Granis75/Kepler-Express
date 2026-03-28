import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { formatCurrencyWithDecimals } from '../lib/utils'

export interface MissionListItemProps {
  reference: string
  client: string
  route: string
  driver: string
  status: 'pending' | 'in_progress' | 'delivered' | 'cancelled' | 'issue'
  revenue: number
  onClick?: () => void
}

const statusStyles = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
  issue: 'bg-red-50 text-red-700 border-red-200',
}

export function MissionListItem({
  reference,
  client,
  route,
  driver,
  status,
  revenue,
  onClick,
}: MissionListItemProps) {
  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-medium text-gray-900">{reference}</p>
          <span
            className={clsx(
              'inline-flex text-xs font-medium px-2 py-0.5 rounded border',
              statusStyles[status]
            )}
          >
            {status === 'in_progress'
              ? 'In Progress'
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <p className="text-xs text-gray-600 truncate">
          {client} • {route}
        </p>
        <p className="text-xs text-gray-500 mt-1">{driver}</p>
      </div>
      <div className="flex items-center gap-3 ml-2">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrencyWithDecimals(revenue)}
          </p>
        </div>
        {onClick && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
      </div>
    </div>
  )

  if (!onClick) {
    return <div className="p-4 border-b border-gray-100">{content}</div>
  }

  return (
    <button
      onClick={onClick}
      className="w-full cursor-pointer text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-100"
      type="button"
    >
      {content}
    </button>
  )
}
