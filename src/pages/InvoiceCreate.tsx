import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { InvoiceForm } from '../components/InvoiceForm'
import type { CreateInvoiceInput } from '../types'
import { getInvoiceReferenceFormat } from '../lib/domain'
import {
  createInvoice,
  listClients,
  listInvoices,
  listMissions,
  useAsyncData,
} from '../lib/data'

export function InvoiceCreate() {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadInvoiceDependencies = useCallback(
    () => Promise.all([listClients(), listMissions(), listInvoices()]),
    []
  )
  const { data, loading, error, reload } = useAsyncData(loadInvoiceDependencies, [])

  const defaultInvoiceNumber = useMemo(
    () => getInvoiceReferenceFormat((data?.[2]?.length ?? 0) + 1),
    [data]
  )

  const handleSubmit = async (invoiceData: CreateInvoiceInput) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      const invoice = await createInvoice(invoiceData)
      navigate(`/invoices/${invoice.invoice_id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to create the invoice.')
    } finally {
      setIsSaving(false)
    }
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

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Loading invoice dependencies...</p>
        </div>
      ) : error || !data ? (
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error || 'Unable to load invoice dependencies.'}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {saveError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}
          <InvoiceForm
            clients={data[0]}
            missions={data[1]}
            defaultInvoiceNumber={defaultInvoiceNumber}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/invoices')}
            submitLabel="Create invoice"
            isLoading={isSaving}
          />
        </>
      )}
    </PageContainer>
  )
}
