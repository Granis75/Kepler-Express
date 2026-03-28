import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Plus, Search } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { InvoiceListItem } from '../components/InvoiceListItem'
import { SelectInput } from '../components/SelectInput'
import { calculateInvoiceAmountRemaining, calculateInvoiceSummary } from '../lib/calculations'
import { getInvoiceStatusOptions } from '../lib/domain'
import { getStoredInvoices } from '../lib/financialStore'
import { mockClients, mockMissions } from '../lib/mockData'
import { formatCurrencyWithDecimals } from '../lib/utils'
import { InvoiceStatus } from '../types'

const statusRank = {
  [InvoiceStatus.Overdue]: 0,
  [InvoiceStatus.Partial]: 1,
  [InvoiceStatus.Sent]: 2,
  [InvoiceStatus.Draft]: 3,
  [InvoiceStatus.Paid]: 4,
  [InvoiceStatus.Cancelled]: 5,
}

export function Invoices() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')

  const invoices = getStoredInvoices()
  const summary = calculateInvoiceSummary(invoices)

  const getClientName = (clientId: string) =>
    mockClients.find((client) => client.client_id === clientId)?.name || '—'

  const getMissionSummary = (missionIds: string[]) => {
    const missionReferences = mockMissions
      .filter((mission) => missionIds.includes(mission.mission_id))
      .map((mission) => mission.reference)

    if (missionReferences.length === 0) {
      return undefined
    }

    if (missionReferences.length === 1) {
      return missionReferences[0]
    }

    return `${missionReferences[0]} +${missionReferences.length - 1}`
  }

  const filteredInvoices = [...invoices]
    .filter((invoice) => {
      const clientName = getClientName(invoice.client_id).toLowerCase()
      const missionSummary = getMissionSummary(invoice.mission_ids)?.toLowerCase() || ''
      const query = searchQuery.trim().toLowerCase()

      const matchesSearch =
        !query ||
        invoice.invoice_number.toLowerCase().includes(query) ||
        clientName.includes(query) ||
        missionSummary.includes(query)

      const matchesStatus = !statusFilter || invoice.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((left, right) => {
      const leftRank = statusRank[left.status]
      const rightRank = statusRank[right.status]

      if (leftRank !== rightRank) {
        return leftRank - rightRank
      }

      return right.invoice_number.localeCompare(left.invoice_number)
    })

  const overdueInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.Overdue)

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description="Billing status and collection follow-up"
        actions={
          <button
            type="button"
            onClick={() => navigate('/invoices/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            Create Invoice
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Outstanding</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrencyWithDecimals(summary.totalOutstanding)}
          </p>
        </div>
        <div className="bg-white border border-red-200 bg-red-50 rounded-lg p-4">
          <p className="text-xs font-medium text-red-700 uppercase">Overdue</p>
          <p className="text-2xl font-bold text-red-800 mt-2">{summary.overdueCount}</p>
          <p className="text-xs text-red-700 mt-1">
            {formatCurrencyWithDecimals(summary.overdueTotal)} due
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Collected</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrencyWithDecimals(summary.totalCollected)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Drafts</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.draftCount}</p>
        </div>
      </div>

      {overdueInvoices.length > 0 && (
        <div className="mb-6 bg-white border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-red-600" />
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Overdue Invoices
            </h2>
          </div>
          <div className="space-y-2">
            {overdueInvoices.map((invoice) => (
              <button
                key={invoice.invoice_id}
                type="button"
                onClick={() => navigate(`/invoices/${invoice.invoice_id}`)}
                className="w-full text-left rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      {getClientName(invoice.client_id)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-red-700">
                    {formatCurrencyWithDecimals(
                      calculateInvoiceAmountRemaining(
                        invoice.amount_total,
                        invoice.amount_paid
                      )
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by invoice, client, or mission"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <SelectInput
            label="Status"
            options={[{ value: '', label: 'All statuses' }, ...getInvoiceStatusOptions()]}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter((event.target.value || '') as InvoiceStatus | '')
            }
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredInvoices.map((invoice) => (
              <InvoiceListItem
                key={invoice.invoice_id}
                id={invoice.invoice_id}
                reference={invoice.invoice_number}
                client={getClientName(invoice.client_id)}
                subtitle={getMissionSummary(invoice.mission_ids)}
                amount={calculateInvoiceAmountRemaining(invoice.amount_total, invoice.amount_paid)}
                status={invoice.status}
                dueDate={invoice.due_date}
                onClick={() => navigate(`/invoices/${invoice.invoice_id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">No invoices match the current filters.</p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
