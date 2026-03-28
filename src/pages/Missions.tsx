import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { Plus, ChevronRight } from 'lucide-react'
import { MissionFilter } from '../components/MissionFilter'
import { mockMissions, mockClients, mockDrivers } from '../lib/mockData'
import { getMissionStatusConfig } from '../lib/domain'
import { formatCurrencyWithDecimals } from '../lib/utils'
import { getStoredVehicles } from '../lib/vehicleStore'

export function Missions() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const storedVehicles = getStoredVehicles()

  // Filter missions
  const filteredMissions = mockMissions.filter((mission) => {
    const matchesStatus = !statusFilter || mission.status === statusFilter
    const matchesSearch = !searchQuery || 
      mission.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.departure_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.arrival_location.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // Get lookup data
  const getClient = (clientId: string) => 
    mockClients.find((c) => c.client_id === clientId)?.name || '—'
  const getDriver = (driverId?: string) => 
    driverId ? (mockDrivers.find((d) => d.driver_id === driverId)?.name || '—') : 'Unassigned'
  const getVehicle = (vehicleId?: string) => 
    vehicleId ? (storedVehicles.find((vehicle) => vehicle.vehicle_id === vehicleId)?.name || '—') : '—'

  return (
    <PageContainer>
      <PageHeader
        title="Missions"
        description="Manage delivery and transport missions"
        actions={
          <button 
            onClick={() => navigate('/missions/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            New Mission
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-6">
        <MissionFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onClearFilters={() => {
            setSearchQuery('')
            setStatusFilter('')
          }}
        />
      </div>

      {/* Missions List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredMissions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredMissions.map((mission) => {
              const statusConfig = getMissionStatusConfig(mission.status)

              return (
                <button
                  key={mission.mission_id}
                  onClick={() => navigate(`/missions/${mission.mission_id}`)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors duration-100 flex items-start justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900">{mission.reference}</p>
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">{getClient(mission.client_id)}</span> • {mission.departure_location} → {mission.arrival_location}
                    </p>
                    <p className="text-xs text-gray-500">
                      Driver: {getDriver(mission.driver_id)} • Vehicle: {getVehicle(mission.vehicle_id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrencyWithDecimals(mission.revenue_amount)}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm mb-2">No missions found</p>
            <p className="text-gray-400 text-xs">Try adjusting your filters or create a new mission</p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
