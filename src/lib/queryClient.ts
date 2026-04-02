import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { toUserFacingMessage } from './supabase-error'

function showGlobalErrorToast(error: unknown, fallbackMessage: string) {
  const message = toUserFacingMessage(error, fallbackMessage)
  toast.error(message, {
    id: `global-error:${message}`,
  })
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      showGlobalErrorToast(error, 'Unable to load data right now.')
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      showGlobalErrorToast(error, 'Unable to complete this action right now.')
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
