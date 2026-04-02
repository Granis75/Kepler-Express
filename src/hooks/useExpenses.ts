import { useQuery } from '@tanstack/react-query'
import { getExpenses } from '../lib/api/expenses'

export function useExpenses(enabled = true) {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: getExpenses,
    enabled,
  })
}
