import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'

export function Settings() {
  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your organization and preferences"
      />

      <div className="space-y-6 max-w-2xl">
        {/* Organization Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900">
                Organization Name
              </label>
              <input
                type="text"
                placeholder="Enter organization name"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">
                Email notifications
              </label>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
