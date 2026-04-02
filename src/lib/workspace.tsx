import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuthState } from './auth'
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import { toUserFacingMessage } from './supabase-error'

export interface WorkspaceOrganization {
  organization_id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface WorkspaceProfile {
  profile_id: string
  user_id: string
  organization_id: string
  role: 'admin' | 'manager' | 'accountant' | 'driver'
  name: string
  email: string
  phone: string | null
  status: 'active' | 'inactive' | 'invited'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface WorkspaceSnapshot {
  profile: WorkspaceProfile | null
  organization: WorkspaceOrganization | null
}

interface WorkspaceContextValue {
  workspaceReady: boolean
  isLoading: boolean
  hasWorkspace: boolean
  profile: WorkspaceProfile | null
  organization: WorkspaceOrganization | null
  error: string | null
  reload: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function loadWorkspaceSnapshot(userId: string): Promise<WorkspaceSnapshot> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
        profile_id,
        user_id,
        organization_id,
        role,
        name,
        email,
        phone,
        status,
        avatar_url,
        created_at,
        updated_at,
        organizations:organization_id (
          organization_id,
          name,
          slug,
          created_at,
          updated_at
        )
      `
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return {
      profile: null,
      organization: null,
    }
  }

  const row = data as {
    profile_id: string
    user_id: string
    organization_id: string
    role: WorkspaceProfile['role']
    name: string
    email: string
    phone: string | null
    status: WorkspaceProfile['status']
    avatar_url: string | null
    created_at: string
    updated_at: string
    organizations:
      | WorkspaceOrganization
      | WorkspaceOrganization[]
      | null
  }

  const organization = Array.isArray(row.organizations)
    ? row.organizations[0] ?? null
    : row.organizations

  return {
    profile: {
      profile_id: row.profile_id,
      user_id: row.user_id,
      organization_id: row.organization_id,
      role: row.role,
      name: row.name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      avatar_url: row.avatar_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    organization,
  }
}

async function loadWorkspaceWithRetry(userId: string) {
  const attempts = [0, 350, 700, 1200]

  for (let index = 0; index < attempts.length; index += 1) {
    if (attempts[index] > 0) {
      await sleep(attempts[index])
    }

    const snapshot = await loadWorkspaceSnapshot(userId)

    if (snapshot.profile && snapshot.organization) {
      return snapshot
    }
  }

  return loadWorkspaceSnapshot(userId)
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { authReady, user } = useAuthState()
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null)
  const [organization, setOrganization] = useState<WorkspaceOrganization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceReady, setWorkspaceReady] = useState(!isSupabaseConfigured())

  const reload = async () => {
    if (!authReady || !user || !isSupabaseConfigured()) {
      setProfile(null)
      setOrganization(null)
      setError(null)
      setIsLoading(false)
      setWorkspaceReady(true)
      return
    }

    setIsLoading(true)
    setWorkspaceReady(false)
    setError(null)

    try {
      const snapshot = await loadWorkspaceWithRetry(user.id)
      setProfile(snapshot.profile)
      setOrganization(snapshot.organization)

      if (!snapshot.profile || !snapshot.organization) {
        setError('Workspace setup is not complete for this account yet.')
      }
    } catch (workspaceError) {
      setProfile(null)
      setOrganization(null)
      setError(toUserFacingMessage(workspaceError, 'Unable to load the workspace.'))
    } finally {
      setIsLoading(false)
      setWorkspaceReady(true)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setWorkspaceReady(true)
      setIsLoading(false)
      setError(null)
      setProfile(null)
      setOrganization(null)
      return
    }

    if (!authReady) {
      setWorkspaceReady(false)
      setIsLoading(false)
      return
    }

    if (!user) {
      setWorkspaceReady(true)
      setIsLoading(false)
      setError(null)
      setProfile(null)
      setOrganization(null)
      return
    }

    void reload()
  }, [authReady, user?.id])

  const value = useMemo(
    () => ({
      workspaceReady,
      isLoading,
      hasWorkspace: Boolean(profile && organization),
      profile,
      organization,
      error,
      reload,
    }),
    [workspaceReady, isLoading, profile, organization, error]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspaceState() {
  const context = useContext(WorkspaceContext)

  if (!context) {
    throw new Error('useWorkspaceState must be used within a WorkspaceProvider.')
  }

  return context
}
