import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { MissionForm } from '../components/MissionForm'
import { ArrowLeft } from 'lucide-react'
import { mockMissions } from '../lib/mockData'
import type { Mission } from '../types'

export function MissionEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const mission = mockMissions.find((m) => m.mission_id === id)
  if (!mission) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Mission not found</p>
        </div>
      </PageContainer>
    )
  }

  const handleSubmit = (data: Partial<Mission>) => {
    // TODO: Update in Supabase
    console.log('Updating mission:', data)
    // For now, navigate back to detail
    navigate(`/missions/${id}`)
  }

  return (
    <PageContainer>
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(`/missions/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <PageHeader title="Edit Mission" description={mission.reference} />
      </div>

      <MissionForm initialData={mission} onSubmit={handleSubmit} />
    </PageContainer>
  )
}
