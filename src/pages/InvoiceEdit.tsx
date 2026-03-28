import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { InvoiceForm } from '../components/InvoiceForm'
import type { CreateInvoiceInput } from '../types'
import { getStoredInvoiceById, upsertStoredInvoice } from '../lib/financialStore'

export function InvoiceEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const invoice = id ? getStoredInvoiceById(id) : undefined

  if (!invoice) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Invoice not found</p>
        </div>
      </PageContainer>
    )
  }

  const handleSubmit = (data: CreateInvoiceInput) => {
    const updatedInvoice = upsertStoredInvoice(data, invoice)
    navigate(`/invoices/${updatedInvoice.invoice_id}`)
  }

  return (
    <PageContainer>
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(`/invoices/${invoice.invoice_id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <PageHeader title="Edit Invoice" description={invoice.invoice_number} />
      </div>

      <InvoiceForm
        initialData={invoice}
        existingPaidAmount={invoice.amount_paid}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/invoices/${invoice.invoice_id}`)}
        submitLabel="Save changes"
      />
    </PageContainer>
  )
}
