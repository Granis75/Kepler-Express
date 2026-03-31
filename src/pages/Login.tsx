import { useState } from 'react'
import { Gauge } from 'lucide-react'
import { TextInput } from '../components/TextInput'
import { getSupabaseClient } from '../lib/data'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAuthError(null)

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setAuthError(error.message)
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
              <Gauge size={22} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
              <p className="text-sm text-gray-500">Access Kepler Express protected data</p>
            </div>
          </div>

          {authError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
            <TextInput
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
