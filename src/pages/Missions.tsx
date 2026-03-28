import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { Plus, ChevronRight } from 'lucide-react'
import { MissionFilter } from '../components/MissionFilter'
import { mockMissions, mockClients, mockDrivers, mockVehicles } from '../lib/mockData'
import { MissionStatus } from '../types'

export function Missions() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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
    mockClients.find((c) => c.client_id === clientId)?.name || 'Unknown Client'
  const getDriver = (driverId?: string) => 
    driverId ? (mockDrivers.find((d) => d.driver_id === driverId)?.name || 'Unassigned') : 'Unassigned'
  const getVehicle = (vehicleId?: string) => 
    vehicleId ? (mockVehicles.find((v) => v.vehicle_id === vehicleId)?.name || 'No Vehicle') : 'No Vehicle'

  // Status styling
  const statusStyles: Record<MissionStatus, string> = {
    [MissionStatus.Planned]: 'bg-gray-50 text-gray-700 border-gray-200',
    [MissionStatus.Assigned]: 'bg-blue-50 text-blue-700 border-blue-200',
    [MissionStatus.InProgress]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    [MissionStatus.Delivered]: 'bg-green-50 text-green-700 border-green-200',
    [MissionStatus.Issue]: 'bg-red-50 text-red-700 border-red-200',
    [MissionStatus.Cancelled]: 'bg-gray-100 text-gray-600 border-gray-300',
  }

  const statusLabels: Record<MissionStatus, string> = {
    [MissionStatus.Planned]: 'Planned',
    [MissionStatus.Assigned]: 'Assigned',
    [MissionStatus.InProgress]: 'In Progress',
    [MissionStatus.Delivered]: 'Delivered',
    [MissionStatus.Issue]: 'Issue',
    [MissionStatus.Cancelled]: 'Cancelled',
  }

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
            {filteredMissions.map((mission) => (
              <button
                key={mission.mission_id}
                onClick={() => navigate(`/missions/${mission.mission_id}`)}
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors duration-100 flex items-start justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-900">{mission.reference}</p>
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded border ${statusStyles[mission.status]}`}>
                      {statusLabels[mission.status]}
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
                    <p className="text-sm font-semibold text-gray-900">€{mission.revenue_amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </button>
            ))}
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
