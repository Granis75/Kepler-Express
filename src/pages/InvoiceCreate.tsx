import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { InvoiceForm } from '../components/InvoiceForm'
import type { CreateInvoiceInput } from '../types'
import { useAuthState } from '../lib/auth'
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
  const { authReady, user } = useAuthState()
  const canLoadProtectedData = authReady && Boolean(user)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadInvoiceDependencies = useCallback(
    () => Promise.all([listClients(), listMissions(), listInvoices()]),
    []
  )
  const { data, loading, error, reload } = useAsyncData(loadInvoiceDependencies, [], {
    enabled: canLoadProtectedData,
  })

  const clients = data?.[0] ?? []
  const missions = data?.[1] ?? []
  const existingInvoices = data?.[2] ?? []

  const defaultInvoiceNumber = useMemo(
    () => getInvoiceReferenceFormat(existingInvoices.length + 1),
    [existingInvoices.length]
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

  if (!authReady) {
    return (
      <PageContainer>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Checking Supabase session...</p>
        </div>
      </PageContainer>
    )
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="bg-white border border-amber-200 rounded-lg p-8 text-center">
          <p className="text-sm text-amber-700">Sign in required to access protected data.</p>
        </div>
      </PageContainer>
    )
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
      ) : clients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-900">No clients yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            Create your first client before issuing an invoice.
          </p>
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to clients
          </button>
        </div>
      ) : missions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-900">No missions ready to bill.</p>
          <p className="mt-2 text-sm text-gray-500">
            Create a mission first, then come back here to issue the invoice.
          </p>
          <button
            type="button"
            onClick={() => navigate('/missions/new')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create mission
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
            clients={clients}
            missions={missions}
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
