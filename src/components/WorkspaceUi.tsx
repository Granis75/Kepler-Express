import clsx from 'clsx'
import type { ReactNode } from 'react'
import { ArrowUpRight, X } from 'lucide-react'

export function SectionCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={clsx(
        'rounded-[1.45rem] border border-stone-200/90 bg-white/92 p-5 shadow-[0_12px_32px_rgba(28,25,23,0.05)] ring-1 ring-white/65 backdrop-blur',
        className
      )}
    >
      {children}
    </section>
  )
}

export function StatCard({
  label,
  value,
  detail,
  tone = 'default',
  onClick,
}: {
  label: string
  value: string
  detail?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
  onClick?: () => void
}) {
  const toneClasses =
    tone === 'success'
      ? 'border-emerald-200/90 bg-[linear-gradient(180deg,_rgba(241,253,247,0.92),_rgba(255,255,255,0.98))]'
      : tone === 'warning'
        ? 'border-amber-200/90 bg-[linear-gradient(180deg,_rgba(255,251,240,0.94),_rgba(255,255,255,0.98))]'
      : tone === 'danger'
          ? 'border-rose-200/90 bg-[linear-gradient(180deg,_rgba(255,244,245,0.94),_rgba(255,255,255,0.98))]'
          : 'border-stone-200/90 bg-[linear-gradient(180deg,_rgba(250,250,249,0.9),_rgba(255,255,255,0.98))]'

  const cardClasses = clsx(
    'group relative rounded-[1.2rem] border p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition',
    onClick && 'hover:border-stone-300 hover:shadow-[0_10px_24px_rgba(28,25,23,0.08)] focus:outline-none focus:ring-4 focus:ring-stone-200',
    toneClasses
  )

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
          {label}
        </p>
        {onClick ? (
          <ArrowUpRight className="h-4 w-4 text-stone-400 transition group-hover:text-stone-700" />
        ) : null}
      </div>
      <p className="mt-3 text-[1.85rem] font-semibold tracking-[-0.04em] text-stone-950">
        {value}
      </p>
      {detail ? <p className="mt-1.5 text-sm leading-6 text-stone-500">{detail}</p> : null}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClasses}>
        {content}
      </button>
    )
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  )
}

export function StatePanel({
  title,
  message,
  tone = 'neutral',
  action,
}: {
  title: string
  message: string
  tone?: 'neutral' | 'danger' | 'warning'
  action?: ReactNode
}) {
  const toneClasses =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50/90'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50/90'
        : 'border-stone-200 bg-white/92'

  return (
    <SectionCard className={clsx('text-center', toneClasses)}>
      <div className="mx-auto max-w-xl py-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-stone-600">{message}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </SectionCard>
  )
}

export function StatusBadge({
  label,
  tone = 'neutral',
  className,
}: {
  label: string
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  className?: string
}) {
  const toneClasses =
    tone === 'info'
      ? 'border-sky-200 bg-sky-50 text-sky-700'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : tone === 'danger'
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-stone-200 bg-stone-100 text-stone-700'

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
        toneClasses,
        className
      )}
    >
      {label}
    </span>
  )
}

export function ActiveFilterBar({
  items,
  onClearAll,
}: {
  items: Array<{
    id: string
    label: string
    value: string
    onClear: () => void
  }>
  onClearAll?: () => void
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="rounded-[1.15rem] border border-stone-200/90 bg-white/88 px-4 py-3 shadow-[0_8px_20px_rgba(28,25,23,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">
          {items.length} active filter{items.length === 1 ? '' : 's'}
        </span>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClear}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50/90 px-3 py-1.5 text-xs text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            <span className="text-stone-500">{item.label}</span>
            <span className="font-medium text-stone-900">{item.value}</span>
            <X className="h-3 w-3 text-stone-500" />
          </button>
        ))}
        {onClearAll ? (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          >
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function DensityToggle({
  value,
  onChange,
}: {
  value: 'compact' | 'comfortable'
  onChange: (value: 'compact' | 'comfortable') => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-stone-200/90 bg-white/92 p-1 shadow-[0_8px_18px_rgba(28,25,23,0.04)]">
      <span className="px-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
        Density
      </span>
      <button
        type="button"
        aria-pressed={value === 'compact'}
        onClick={() => onChange('compact')}
        className={clsx(
          'rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300',
          value === 'compact'
            ? 'bg-stone-950 text-white shadow-[0_8px_18px_rgba(28,25,23,0.12)]'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        )}
      >
        Compact
      </button>
      <button
        type="button"
        aria-pressed={value === 'comfortable'}
        onClick={() => onChange('comfortable')}
        className={clsx(
          'rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300',
          value === 'comfortable'
            ? 'bg-stone-950 text-white shadow-[0_8px_18px_rgba(28,25,23,0.12)]'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        )}
      >
        Comfortable
      </button>
    </div>
  )
}

export function SelectionToolbar({
  count,
  label,
  meta,
  actions,
  onClear,
}: {
  count: number
  label?: string
  meta?: string
  actions?: ReactNode
  onClear: () => void
}) {
  if (count === 0) {
    return null
  }

  return (
    <div className="sticky top-24 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-stone-200/90 bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(28,25,23,0.05)] backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-stone-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
          {count} selected
        </span>
        {label ? <p className="text-sm text-stone-700">{label}</p> : null}
        {meta ? <p className="text-xs text-stone-500">{meta}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
        >
          Clear selection
        </button>
      </div>
    </div>
  )
}

export function ActionPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <SectionCard className={clsx('overflow-hidden p-0', className)}>
      <div className="divide-y divide-stone-200">{children}</div>
    </SectionCard>
  )
}

export function ActionItem({
  title,
  actionLabel,
  onClick,
  tone = 'neutral',
  count,
}: {
  title: string
  actionLabel: string
  onClick: () => void
  tone?: 'neutral' | 'warning' | 'danger'
  count?: number
}) {
  const rowToneClasses =
    tone === 'danger'
      ? 'border-l-2 border-rose-300 bg-[linear-gradient(180deg,_rgba(255,244,245,0.7),_rgba(255,255,255,0.98))] pl-[18px] pr-5 hover:bg-rose-50/90'
      : tone === 'warning'
        ? 'border-l-2 border-amber-300 bg-[linear-gradient(180deg,_rgba(255,251,235,0.75),_rgba(255,255,255,0.98))] pl-[18px] pr-5 hover:bg-amber-50/90'
        : 'px-5 hover:bg-stone-100'

  const actionToneClasses =
    tone === 'danger'
      ? 'border-rose-200 text-rose-700 group-hover:border-rose-300 group-hover:bg-rose-50'
      : tone === 'warning'
        ? 'border-amber-200 text-amber-800 group-hover:border-amber-300 group-hover:bg-amber-50'
        : 'border-stone-300 text-stone-700 group-hover:bg-stone-100'

  const countToneClasses =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-stone-200 bg-stone-100 text-stone-700'

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group flex w-full items-center justify-between gap-4 py-4 text-left transition active:scale-[0.998] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300',
        rowToneClasses
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={clsx(
            'inline-flex min-w-8 items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums',
            countToneClasses
          )}
        >
          {count ?? 0}
        </span>
        <p className="min-w-0 text-sm font-semibold text-stone-950">{title}</p>
      </div>
      <div
        className={clsx(
          'inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-medium transition group-hover:text-stone-900',
          actionToneClasses
        )}
      >
        <span>{actionLabel}</span>
        <ArrowUpRight className="h-3.5 w-3.5" />
      </div>
    </button>
  )
}

export function ModalSurface({
  title,
  description,
  children,
  onClose,
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/80 bg-[#fcfaf6] shadow-[0_36px_120px_rgba(28,25,23,0.2)] ring-1 ring-stone-200/70">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-200 bg-[#fcfaf6]/96 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-stone-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-3 py-1.5"
          >
            Close
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function PageLoadingSkeleton({
  stats = 4,
  rows = 4,
}: {
  stats?: number
  rows?: number
}) {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: stats }).map((_, index) => (
          <div
            key={`stat-${index}`}
            className="h-32 rounded-[1.55rem] border border-stone-200 bg-white/78"
          />
        ))}
      </div>

      <div className="rounded-[1.8rem] border border-stone-200 bg-white/80 p-6">
        <div className="h-12 rounded-2xl bg-stone-100/90" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={`row-${index}`}
            className="h-56 rounded-[1.8rem] border border-stone-200 bg-white/80"
          />
        ))}
      </div>
    </div>
  )
}
