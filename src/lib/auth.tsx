import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from './data'
import { resetOrganizationCache } from './data/session'

interface AuthContextValue {
  authReady: boolean
  session: Session | null
  user: User | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) {
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

        resetOrganizationCache()
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
  }, [])

  const value = useMemo(
    () => ({
      authReady,
      session,
      user,
    }),
    [authReady, session, user]
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
