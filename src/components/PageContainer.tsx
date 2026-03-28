import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="max-w-7xl mx-auto px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
      {children}
    </div>
  )
}
