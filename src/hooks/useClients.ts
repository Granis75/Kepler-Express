import { useQuery } from '@tanstack/react-query'
import { getClients } from '../lib/api/clients'

export function useClients(enabled = true) {
  return useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
    enabled,
  })
}
