import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { Plus } from 'lucide-react'

export function Drivers() {
  return (
    <PageContainer>
      <PageHeader
        title="Drivers"
        description="Manage your driver team and assignments"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
            <Plus size={18} />
            Add Driver
          </button>
        }
      />

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 text-center">
          <p className="text-gray-500 text-sm">No drivers yet</p>
          <p className="text-xs text-gray-400 mt-2">Connect to Supabase to start</p>
        </div>
      </div>
    </PageContainer>
  )
}
