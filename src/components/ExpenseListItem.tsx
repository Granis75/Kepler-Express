import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { formatCurrencyWithDecimals } from '../lib/utils'

export interface ExpenseListItemProps {
  mission: string
  category: string
  amount: number
  driver: string
  status: 'pending' | 'reimbursed' | 'disputed'
  advancedByDriver: boolean
  onClick?: () => void
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  reimbursed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  disputed: 'bg-rose-50 text-rose-700 border-rose-200',
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
  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-sm font-medium text-slate-950">{category}</p>
          {advancedByDriver && (
            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-700">
              Driver Advance
            </span>
          )}
          <span
            className={clsx(
              'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]',
              statusStyles[status]
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <p className="truncate text-xs text-slate-600">
          {mission} • {driver}
        </p>
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
