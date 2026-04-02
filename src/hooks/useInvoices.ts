import { useQuery } from '@tanstack/react-query'
import { getInvoices } from '../lib/api/invoices'

export function useInvoices(enabled = true) {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices,
    enabled,
  })
}
