import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="mx-auto max-w-[1560px] px-5 py-6 sm:px-6 lg:px-8">
      {children}
    </div>
  )
}
