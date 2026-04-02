import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ClientForm } from '../components/ClientForm'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { ModalSurface, SectionCard, StatePanel, StatusBadge } from '../components/WorkspaceUi'
import { useClients } from '../hooks'
import { getClientStatusConfig } from '../lib/domain'
import { createClient, updateClient } from '../lib/data'
import { formatPhoneNumber, toSearchValue } from '../lib/utils'
import { useWorkspaceState } from '../lib/workspace'
import type { Client, CreateClientInput } from '../types'

export function Clients() {
  const { organization } = useWorkspaceState()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const {
    data: clients = [],
    isLoading,
    error,
    refetch,
  } = useClients()

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return clients.filter((client) => {
      if (!query) {
        return true
      }

      return (
        toSearchValue(client.name).includes(query) ||
        toSearchValue(client.email).includes(query) ||
        toSearchValue(client.city).includes(query)
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

      toast.success(selectedClient ? 'Client updated.' : 'Client created.')
      closeForm()
      await refetch()
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save the client.'
      setActionError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description={`Customer accounts and operational context for ${organization?.name ?? 'the current workspace'}.`}
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedClient(null)
              setActionError(null)
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            New client
          </button>
        }
      />

      {showForm ? (
        <ModalSurface
          title={selectedClient ? 'Edit client' : 'Create client'}
          description="Keep customer records clean and reusable across missions and invoices."
          onClose={closeForm}
        >
          {actionError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
          <ClientForm
            initialData={selectedClient ?? undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            submitLabel={selectedClient ? 'Save client' : 'Create client'}
            isLoading={isSaving}
          />
        </ModalSurface>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <SectionCard className="h-fit">
          <div className="mb-5">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
              Browse
            </h2>
            <p className="text-sm text-stone-500">
              Search by client name, email, or city.
            </p>
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search clients"
              className="w-full rounded-2xl border border-stone-300 bg-white px-11 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Visible clients</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
              {filteredClients.length}
            </p>
            <p className="mt-2 text-sm text-stone-500">
              {clients.length} total record{clients.length > 1 ? 's' : ''} in this workspace.
            </p>
          </div>
        </SectionCard>

        {isLoading ? (
          <div className="grid animate-pulse gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`client-skeleton-${index}`}
                className="h-64 rounded-[1.75rem] border border-stone-200 bg-white/80"
              />
            ))}
          </div>
        ) : error instanceof Error ? (
          <StatePanel
            tone="danger"
            title="Unable to load clients"
            message={error.message}
            action={
              <button
                type="button"
                onClick={() => {
                  void refetch()
                }}
                className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                Retry
              </button>
            }
          />
        ) : filteredClients.length === 0 ? (
          <StatePanel
            title={clients.length === 0 ? 'No clients yet' : 'No matching clients'}
            message={
              clients.length === 0
                ? 'Create the first client to unlock mission planning and invoice creation.'
                : 'Adjust the current search to surface another customer record.'
            }
            action={
              clients.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null)
                    setShowForm(true)
                  }}
                  className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  Create client
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                >
                  Clear search
                </button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredClients.map((client) => {
              const status = getClientStatusConfig(client.status)

              return (
                <SectionCard key={client.client_id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                          {client.name}
                        </h2>
                        <StatusBadge
                          label={status.label}
                          tone={
                            client.status === 'active'
                              ? 'success'
                              : client.status === 'inactive'
                                ? 'warning'
                                : 'neutral'
                          }
                        />
                      </div>
                      <p className="mt-2 text-sm text-stone-500">{client.email}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient(client)
                        setActionError(null)
                        setShowForm(true)
                      }}
                      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Phone</p>
                      <p className="mt-2 text-sm font-medium text-stone-900">
                        {formatPhoneNumber(client.phone)}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Location</p>
                      <p className="mt-2 text-sm font-medium text-stone-900">
                        {[client.city, client.country].filter(Boolean).join(', ') || 'No city set'}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Address</p>
                      <p className="mt-2 text-sm font-medium text-stone-900">
                        {client.address || 'No address set'}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">VAT</p>
                      <p className="mt-2 text-sm font-medium text-stone-900">
                        {client.vat_number || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {client.notes ? (
                    <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Notes</p>
                      <p className="mt-2 text-sm leading-7 text-stone-600">{client.notes}</p>
                    </div>
                  ) : null}
                </SectionCard>
              )
            })}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
