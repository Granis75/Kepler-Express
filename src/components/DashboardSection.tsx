import { ReactNode } from 'react'

interface DashboardSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function DashboardSection({
  title,
  description,
  children,
}: DashboardSectionProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {children}
      </div>
    </div>
  )
}
