import { useCallback, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { ClientForm } from '../components/ClientForm'
import { formatPhoneNumber } from '../lib/utils'
import { getClientStatusConfig } from '../lib/domain'
import { createClient, listClients, updateClient, useAsyncData } from '../lib/data'
import type { Client, CreateClientInput } from '../types'

export function Clients() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadClients = useCallback(() => listClients(), [])
  const { data: clients, loading, error, reload } = useAsyncData(loadClients, [])

  const filteredClients = useMemo(() => {
    if (!clients) {
      return []
    }

    const query = searchQuery.trim().toLowerCase()

    return clients.filter((client) => {
      if (!query) {
        return true
      }

      return (
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.city.toLowerCase().includes(query)
      )
    })
  }, [clients, searchQuery])

  const closeForm = () => {
    setShowForm(false)
    setSelectedClient(null)
    setActionError(null)
  }

  const handleSubmit = async (data: CreateClientInput) => {
    setIsSaving(true)
    setActionError(null)

    try {
      if (selectedClient) {
        await updateClient(selectedClient.client_id, data)
      } else {
        await createClient(data)
      }

      closeForm()
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save the client.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description="Manage customer accounts from live Supabase data"
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedClient(null)
              setActionError(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            Add Client
          </button>
        }
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {selectedClient ? 'Edit client' : 'New client'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}
              <ClientForm
                initialData={selectedClient ?? undefined}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                submitLabel={selectedClient ? 'Save changes' : 'Create client'}
                isLoading={isSaving}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search clients by name, email, or city"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Loading clients...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            {clients && clients.length > 0
              ? 'No clients match the current search.'
              : 'No clients found in Supabase yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredClients.map((client) => {
              const statusConfig = getClientStatusConfig(client.status)

              return (
                <button
                  key={client.client_id}
                  type="button"
                  onClick={() => {
                    setSelectedClient(client)
                    setActionError(null)
                    setShowForm(true)
                  }}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors duration-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-0.5 rounded border ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{client.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPhoneNumber(client.phone)} • {client.city}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
