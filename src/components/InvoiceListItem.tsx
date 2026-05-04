import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { InvoiceStatus } from '../types'
import { getInvoiceStatusConfig } from '../lib/domain'
import { formatCurrencyWithDecimals, formatDate } from '../lib/utils'

export interface InvoiceListItemProps {
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
  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-sm font-medium text-slate-950">{reference}</p>
          <span
            className={clsx(
              'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]',
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </span>
        </div>
        <p className="truncate text-xs text-slate-600">{client}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        <p className="mt-1 text-xs text-slate-500">Due: {formatDate(dueDate)}</p>
      </div>
      <div className="ml-2 flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-950">
            {formatCurrencyWithDecimals(amount)}
          </p>
        </div>
        {onClick && <ChevronRight size={16} className="shrink-0 text-slate-400" />}
      </div>
    </div>
  )

  if (!onClick) {
    return <div className="border-b border-slate-200 p-4">{content}</div>
  }

  return (
    <button
      onClick={onClick}
      className="w-full cursor-pointer border-b border-slate-200 p-4 text-left transition-colors duration-100 hover:bg-slate-50"
      type="button"
    >
      {content}
    </button>
  )
}
