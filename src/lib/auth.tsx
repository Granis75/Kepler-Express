import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

interface OrganizationContext {
  organization_id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

interface ProfileContext {
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

interface SignInInput {
  email: string
  password: string
}

interface SignUpInput {
  fullName: string
  organizationName: string
  email: string
  password: string
}

interface AuthContextValue {
  authReady: boolean
  session: Session | null
  user: User | null
  profile: ProfileContext | null
  organization: OrganizationContext | null
  authError: string | null
  signIn: (input: SignInInput) => Promise<void>
  signUp: (input: SignUpInput) => Promise<{ emailConfirmationRequired: boolean }>
  signOut: () => Promise<void>
  refreshWorkspace: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function loadWorkspaceContext(userId: string) {
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
    role: 'admin' | 'manager' | 'accountant' | 'driver'
    name: string
    email: string
    phone: string | null
    status: 'active' | 'inactive' | 'invited'
    avatar_url: string | null
    created_at: string
    updated_at: string
    organizations:
      | {
          organization_id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
      | {
          organization_id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }[]
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
    organization: organization
      ? {
          organization_id: organization.organization_id,
          name: organization.name,
          slug: organization.slug,
          created_at: organization.created_at,
          updated_at: organization.updated_at,
        }
      : null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileContext | null>(null)
  const [organization, setOrganization] = useState<OrganizationContext | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return
    }

    const supabase = getSupabaseClient()
    let isCancelled = false

    async function applySession(nextSession: Session | null) {
      setSession(nextSession ?? null)
      setUser(nextSession?.user ?? null)
      setProfile(null)
      setOrganization(null)
      setAuthError(null)

      if (!nextSession?.user) {
        setAuthReady(true)
        return
      }

      try {
        const workspace = await loadWorkspaceContext(nextSession.user.id)

        if (isCancelled) {
          return
        }

        setProfile(workspace.profile)
        setOrganization(workspace.organization)

        if (!workspace.profile || !workspace.organization) {
          setAuthError('Workspace profile not found for this account.')
        }
      } catch (error) {
        if (isCancelled) {
          return
        }

        setAuthError(
          error instanceof Error ? error.message : 'Unable to load workspace context.'
        )
      } finally {
        if (!isCancelled) {
          setAuthReady(true)
        }
      }
    }

    async function bootstrapAuth() {
      try {
        const {
          data: { session: nextSession },
        } = await supabase.auth.getSession()

        if (isCancelled) {
          return
        }

        await applySession(nextSession ?? null)
      } finally {
        if (!isCancelled) {
          setAuthReady(true)
        }
      }
    }

    void bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isCancelled) {
        return
      }

      setAuthReady(false)
      void applySession(nextSession ?? null)
    })

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async ({ email, password }: SignInInput) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      throw error
    }
  }

  const signUp = async ({ fullName, organizationName, email, password }: SignUpInput) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          organization_name: organizationName.trim(),
        },
      },
    })

    if (error) {
      throw error
    }

    return {
      emailConfirmationRequired: !data.session,
    }
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }
  }

  const refreshWorkspace = async () => {
    if (!user) {
      setProfile(null)
      setOrganization(null)
      setAuthError(null)
      return
    }

    const workspace = await loadWorkspaceContext(user.id)
    setProfile(workspace.profile)
    setOrganization(workspace.organization)
    setAuthError(
      !workspace.profile || !workspace.organization
        ? 'Workspace profile not found for this account.'
        : null
    )
  }

  const value = useMemo(
    () => ({
      authReady,
      session,
      user,
      profile,
      organization,
      authError,
      signIn,
      signUp,
      signOut,
      refreshWorkspace,
    }),
    [authReady, session, user, profile, organization, authError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthState() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthState must be used within an AuthProvider.')
  }

  return context
}
