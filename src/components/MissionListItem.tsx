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
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  in_progress: 'bg-teal-50 text-teal-700 border-teal-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  issue: 'bg-rose-50 text-rose-700 border-rose-200',
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
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-sm font-medium text-slate-950">{reference}</p>
          <span
            className={clsx(
              'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]',
              statusStyles[status]
            )}
          >
            {status === 'in_progress'
              ? 'In Progress'
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <p className="truncate text-xs text-slate-600">
          {client} • {route}
        </p>
        <p className="mt-1 text-xs text-slate-500">{driver}</p>
      </div>
      <div className="ml-2 flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-950">
            {formatCurrencyWithDecimals(revenue)}
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
