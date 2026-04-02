import { useQuery } from '@tanstack/react-query'
import { getPaymentsByInvoice } from '../lib/api/payments'

export function usePaymentsByInvoice(invoiceId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      if (!invoiceId) {
        throw new Error('Invoice ID is required.')
      }

      return getPaymentsByInvoice(invoiceId)
    },
    enabled: enabled && Boolean(invoiceId),
  })
}
