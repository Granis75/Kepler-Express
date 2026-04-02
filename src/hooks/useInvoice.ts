import { useQuery } from '@tanstack/react-query'
import { getInvoiceById } from '../lib/api/invoices'

export function useInvoice(invoiceId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['invoices', invoiceId],
    queryFn: async () => {
      if (!invoiceId) {
        throw new Error('Invoice ID is required.')
      }

      return getInvoiceById(invoiceId)
    },
    enabled: enabled && Boolean(invoiceId),
  })
}
