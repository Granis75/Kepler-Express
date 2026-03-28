import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { MissionForm } from '../components/MissionForm'
import { ArrowLeft } from 'lucide-react'
import type { Mission } from '../types'

export function MissionCreate() {
  const navigate = useNavigate()

  const handleSubmit = (data: Partial<Mission>) => {
    // TODO: Save to Supabase
    console.log('Creating mission:', data)
    // For now, just navigate back
    navigate('/missions')
  }

  return (
    <PageContainer>
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate('/missions')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <PageHeader title="Create Mission" description="Set up a new delivery or transport mission" />
      </div>

      <MissionForm onSubmit={handleSubmit} />
    </PageContainer>
  )
}
