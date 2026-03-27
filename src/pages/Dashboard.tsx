import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'

export function Dashboard() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your logistics operations"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI Cards */}
        {['Active Missions', 'Total Revenue', 'Pending Invoices', 'Fleet Health'].map(
          (label) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <p className="text-sm font-medium text-gray-600">{label}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">—</p>
              <p className="text-xs text-gray-500 mt-3">Data pending setup</p>
            </div>
          )
        )}
      </div>

      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            Connect to Supabase to see live data
          </p>
        </div>
      </div>
    </PageContainer>
  )
}
