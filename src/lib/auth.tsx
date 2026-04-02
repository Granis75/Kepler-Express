import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { resetOrganizationCache } from './data/session'
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import { toUserFacingError } from './supabase-error'

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
  isConfigured: boolean
  session: Session | null
  user: User | null
  signIn: (input: SignInInput) => Promise<void>
  signUp: (input: SignUpInput) => Promise<{ emailConfirmationRequired: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isConfigured = isSupabaseConfigured()
  const [authReady, setAuthReady] = useState(!isConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!isConfigured) {
      setAuthReady(true)
      setSession(null)
      setUser(null)
      return
    }

    const supabase = getSupabaseClient()
    let isCancelled = false

    async function bootstrapAuth() {
      try {
        const {
          data: { session: nextSession },
        } = await supabase.auth.getSession()

        if (isCancelled) {
          return
        }

        setSession(nextSession ?? null)
        setUser(nextSession?.user ?? null)
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

      resetOrganizationCache()
      setSession(nextSession ?? null)
      setUser(nextSession?.user ?? null)
      setAuthReady(true)
    })

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [isConfigured])

  const signIn = async ({ email, password }: SignInInput) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      throw toUserFacingError(error, 'Unable to sign in.')
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
      throw toUserFacingError(error, 'Unable to create your account.')
    }

    return {
      emailConfirmationRequired: !data.session,
    }
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw toUserFacingError(error, 'Unable to sign out.')
    }

    resetOrganizationCache()
  }

  const value = useMemo(
    () => ({
      authReady,
      isConfigured,
      session,
      user,
      signIn,
      signUp,
      signOut,
    }),
    [authReady, isConfigured, session, user]
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
