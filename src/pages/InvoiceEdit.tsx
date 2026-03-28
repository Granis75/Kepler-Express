import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { InvoiceForm } from '../components/InvoiceForm'
import type { CreateInvoiceInput } from '../types'
import {
  getInvoiceById,
  listClients,
  listMissions,
  updateInvoice,
  useAsyncData,
} from '../lib/data'

export function InvoiceEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadInvoiceEditData = useCallback(async () => {
    if (!id) {
      throw new Error('Invoice ID is required.')
    }

    const [invoice, clients, missions] = await Promise.all([
      getInvoiceById(id),
      listClients(),
      listMissions(),
    ])

    return {
      invoice,
      clients,
      missions,
    }
  }, [id])

  const { data, loading, error, reload } = useAsyncData(loadInvoiceEditData, [id])

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </PageContainer>
    )
  }

  if (error || !data) {
    return (
      <PageContainer>
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error || 'Unable to load the invoice.'}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageContainer>
    )
  }

  const { invoice, clients, missions } = data

  const handleSubmit = async (invoiceData: CreateInvoiceInput) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      const updatedInvoice = await updateInvoice(invoice.invoice_id, invoiceData, invoice)
      navigate(`/invoices/${updatedInvoice.invoice_id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to update the invoice.')
    } finally {
      setIsSaving(false)
    }
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

      {saveError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <InvoiceForm
        clients={clients}
        missions={missions}
        initialData={invoice}
        existingPaidAmount={invoice.amount_paid}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/invoices/${invoice.invoice_id}`)}
        submitLabel="Save changes"
        isLoading={isSaving}
      />
    </PageContainer>
  )
}
