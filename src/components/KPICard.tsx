import { ReactNode } from 'react'
import clsx from 'clsx'

interface KPICardProps {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  onClick?: () => void
  variant?: 'default' | 'alert'
}

export function KPICard({
  label,
  value,
  change,
  trend,
  icon,
  onClick,
  variant = 'default',
}: KPICardProps) {
  const content = (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        {change && (
          <p
            className={clsx(
              'mt-2 text-xs font-medium',
              trend === 'up' && 'text-rose-700',
              trend === 'down' && 'text-emerald-700',
              trend === 'neutral' && 'text-slate-500'
            )}
          >
            {change}
          </p>
        )}
      </div>
      {icon && <div className="ml-2 text-teal-700">{icon}</div>}
    </div>
  )

  if (!onClick) {
    return (
      <div
        className={clsx(
          'rounded-lg border p-4 text-left shadow-[0_12px_32px_rgba(15,23,42,0.04)]',
          variant === 'alert' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
        )}
      >
        {content}
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-lg border p-4 text-left transition-all duration-150',
        'hover:shadow-sm',
        variant === 'alert'
          ? 'border-rose-200 bg-rose-50 hover:border-rose-300'
          : 'border-slate-200 bg-white hover:border-slate-300',
        'cursor-pointer'
      )}
      type="button"
    >
      {content}
    </button>
  )
}
