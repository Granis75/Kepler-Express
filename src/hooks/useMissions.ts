import { useQuery } from '@tanstack/react-query'
import { getMissions } from '../lib/api/missions'

export function useMissions(enabled = true) {
  return useQuery({
    queryKey: ['missions'],
    queryFn: getMissions,
    enabled,
  })
}
