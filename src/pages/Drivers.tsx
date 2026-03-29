import { useCallback, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { listDrivers, useAsyncData } from '../lib/data'
import { getDriverStatusConfig } from '../lib/domain'
import { formatDate, formatPhoneNumber, toSearchValue } from '../lib/utils'

export function Drivers() {
  const [searchQuery, setSearchQuery] = useState('')

  const loadDrivers = useCallback(() => listDrivers(), [])
  const { data: drivers, loading, error, reload } = useAsyncData(loadDrivers, [])

  const filteredDrivers = useMemo(() => {
    if (!drivers) {
      return []
    }

    const query = searchQuery.trim().toLowerCase()

    return drivers.filter((driver) => {
      if (!query) {
        return true
      }

      return (
        toSearchValue(driver.name).includes(query) ||
        toSearchValue(driver.phone).includes(query) ||
        toSearchValue(driver.license_number).includes(query)
      )
    })
  }, [drivers, searchQuery])

  return (
    <PageContainer>
      <PageHeader
        title="Drivers"
        description="Team availability and compliance status"
      />

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, phone, or licence"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">Loading drivers...</p>
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
      ) : filteredDrivers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            {drivers && drivers.length > 0
              ? 'No drivers match the current search.'
              : 'No drivers found in Supabase yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredDrivers.map((driver) => {
              const statusConfig = getDriverStatusConfig(driver.status)

              return (
                <div key={driver.driver_id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold text-gray-900">{driver.name}</p>
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-0.5 rounded border ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{formatPhoneNumber(driver.phone)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Licence {driver.license_number} • expires {formatDate(driver.license_expiry)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
