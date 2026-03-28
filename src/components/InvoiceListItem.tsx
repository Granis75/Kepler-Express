import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'

export interface InvoiceListItemProps {
  id: string
  reference: string
  client: string
  amount: number
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue'
  dueDate: string
  onClick?: () => void
}

const statusStyles = {
  draft: 'bg-gray-50 text-gray-700 border-gray-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  partial: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
}

export function InvoiceListItem({
  reference,
  client,
  amount,
  status,
  dueDate,
  onClick,
}: InvoiceListItemProps) {
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
            <p className="text-sm font-medium text-gray-900">{reference}</p>
            <span
              className={clsx(
                'inline-flex text-xs font-medium px-2 py-0.5 rounded border',
                statusStyles[status]
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-gray-600 truncate">{client}</p>
          <p className="text-xs text-gray-500 mt-1">Due: {dueDate}</p>
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
