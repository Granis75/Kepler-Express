import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <span className="eyebrow-chip">Operations module</span>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-stone-950 sm:text-[2.65rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500 sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}
