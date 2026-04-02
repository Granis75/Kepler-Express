import { PageContainer } from '../components/PageContainer'
import { PageHeader } from '../components/PageHeader'
import { SectionCard, StatCard, StatusBadge } from '../components/WorkspaceUi'
import { useAuthState } from '../lib/auth'
import { useWorkspaceState } from '../lib/workspace'

export function Settings() {
  const { isConfigured, session } = useAuthState()
  const { profile, organization, error, hasWorkspace } = useWorkspaceState()

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Workspace visibility and environment health for the internal tool."
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Supabase"
            value={isConfigured ? 'Ready' : 'Missing'}
            tone={isConfigured ? 'success' : 'danger'}
          />
          <StatCard
            label="Session"
            value={session ? 'Active' : 'Inactive'}
            tone={session ? 'success' : 'warning'}
          />
          <StatCard
            label="Workspace"
            value={hasWorkspace ? 'Attached' : 'Unavailable'}
            tone={hasWorkspace ? 'success' : 'danger'}
          />
          <StatCard
            label="Role"
            value={profile?.role ?? '—'}
            detail={profile?.status ?? 'No profile'}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SectionCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                  Organization
                </h2>
                <p className="text-sm text-stone-500">
                  Current workspace attached through the Supabase signup bootstrap.
                </p>
              </div>
              <StatusBadge
                label={hasWorkspace ? 'Connected' : 'Missing'}
                tone={hasWorkspace ? 'success' : 'danger'}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Name</p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {organization?.name ?? 'Not available'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Slug</p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {organization?.slug ?? 'Not available'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  Organization id
                </p>
                <p className="mt-2 break-all text-sm font-medium text-stone-900">
                  {organization?.organization_id ?? 'Not available'}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                  Profile
                </h2>
                <p className="text-sm text-stone-500">
                  The authenticated user mapped to the workspace profile.
                </p>
              </div>
              <StatusBadge
                label={profile?.status ?? 'Unknown'}
                tone={profile?.status === 'active' ? 'success' : 'warning'}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Name</p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {profile?.name ?? 'Not available'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Email</p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {profile?.email ?? 'Not available'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Role</p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {profile?.role ?? 'Not available'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Phone</p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {profile?.phone ?? 'Not provided'}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
            Notes
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
            This V1 keeps the product surface narrow on purpose: only modules backed by the
            current stable schema stay active. Authentication and workspace creation continue
            to flow through Supabase, while the app focuses on daily operations and billing.
          </p>
          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </SectionCard>
      </div>
    </PageContainer>
  )
}
