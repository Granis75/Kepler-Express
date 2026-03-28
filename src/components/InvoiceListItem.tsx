import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { InvoiceStatus } from '../types'
import { getInvoiceStatusConfig } from '../lib/domain'
import { formatCurrencyWithDecimals, formatDate } from '../lib/utils'

export interface InvoiceListItemProps {
  id: string
  reference: string
  client: string
  amount: number
  status: InvoiceStatus
  dueDate: string
  subtitle?: string
  onClick?: () => void
}

export function InvoiceListItem({
  reference,
  client,
  amount,
  status,
  dueDate,
  subtitle,
  onClick,
}: InvoiceListItemProps) {
  const statusConfig = getInvoiceStatusConfig(status)

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
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </span>
          </div>
          <p className="text-xs text-gray-600 truncate">{client}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          <p className="text-xs text-gray-500 mt-1">Due: {formatDate(dueDate)}</p>
        </div>
        <div className="flex items-center gap-3 ml-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrencyWithDecimals(amount)}
            </p>
          </div>
          {onClick && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
        </div>
      </div>
    </button>
  )
}
