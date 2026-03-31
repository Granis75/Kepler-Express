import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './lib/auth'
import { queryClient } from './lib/query-client'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
