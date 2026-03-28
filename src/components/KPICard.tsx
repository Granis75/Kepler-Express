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
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
        {change && (
          <p
            className={clsx(
              'text-xs mt-2 font-medium',
              trend === 'up' && 'text-red-600',
              trend === 'down' && 'text-green-600',
              trend === 'neutral' && 'text-gray-500'
            )}
          >
            {change}
          </p>
        )}
      </div>
      {icon && <div className="text-gray-400 ml-2">{icon}</div>}
    </div>
  )

  if (!onClick) {
    return (
      <div
        className={clsx(
          'text-left p-4 rounded-lg border',
          variant === 'alert' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
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
        'text-left p-4 rounded-lg border transition-all duration-150',
        'hover:shadow-sm',
        variant === 'alert'
          ? 'border-red-200 bg-red-50 hover:border-red-300'
          : 'border-gray-200 bg-white hover:border-gray-300',
        'cursor-pointer'
      )}
      type="button"
    >
      {content}
    </button>
  )
}
