import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { InvoiceForm } from '../components/InvoiceForm'
import type { CreateInvoiceInput } from '../types'
import { getInvoiceReferenceFormat } from '../lib/domain'
import { getStoredInvoices, upsertStoredInvoice } from '../lib/financialStore'

export function InvoiceCreate() {
  const navigate = useNavigate()
  const defaultInvoiceNumber = getInvoiceReferenceFormat(getStoredInvoices().length + 1)

  const handleSubmit = (data: CreateInvoiceInput) => {
    const invoice = upsertStoredInvoice(data)
    navigate(`/invoices/${invoice.invoice_id}`)
  }

  return (
    <PageContainer>
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <PageHeader
          title="Create Invoice"
          description="Set up a bill and let payment activity drive the live status."
        />
      </div>

      <InvoiceForm
        defaultInvoiceNumber={defaultInvoiceNumber}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/invoices')}
        submitLabel="Create invoice"
      />
    </PageContainer>
  )
}
