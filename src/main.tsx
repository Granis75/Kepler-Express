import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import { AuthProvider } from './lib/auth'
import { WorkspaceProvider } from './lib/workspace'
import { queryClient } from './lib/queryClient'
import './main.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <App />
          <Toaster position="top-right" />
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
