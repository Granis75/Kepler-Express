import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { isSupabaseConfigured } from '../lib/data'
import { useAuthState } from '../lib/auth'

export function Settings() {
  const supabaseConfigured = isSupabaseConfigured()
  const { profile, organization } = useAuthState()

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Workspace configuration and environment status"
      />

      <div className="space-y-6 max-w-3xl">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Data source
              </p>
              <p className="text-gray-900">
                {supabaseConfigured ? 'Supabase configured' : 'Supabase not configured'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Product scope
              </p>
              <p className="text-gray-900">Operations modules only</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workspace</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Organization
              </p>
              <p className="text-gray-900">{organization?.name ?? 'Not loaded'}</p>
              <p className="text-xs text-gray-500 mt-1">{organization?.slug ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Profile
              </p>
              <p className="text-gray-900">{profile?.name ?? 'Not loaded'}</p>
              <p className="text-xs text-gray-500 mt-1">{profile?.role ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Administration</h2>
          <p className="text-sm text-gray-600 leading-6">
            Organization details, access control, and authentication are managed in
            Supabase for this V1. This app focuses on day-to-day operations rather than
            back-office administration.
          </p>
        </div>
      </div>
    </PageContainer>
  )
}
