import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AuthScene } from '../components/AuthScene'
import { TextInput } from '../components/TextInput'
import { useAuthState } from '../lib/auth'
import { publicRoutes } from '../lib/routes'

export function Login() {
  const { signIn, isConfigured } = useAuthState()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAuthError(null)

    try {
      await signIn({
        email: email.trim(),
        password,
      })
      toast.success('Welcome back.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.'
      setAuthError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthScene
      title="Log in"
      subtitle="Access the protected workspace with your existing organization account."
      footer={
        <>
          Need a workspace?{' '}
          <Link to={publicRoutes.signup} className="font-medium text-teal-700 hover:text-teal-800">
            Create account
          </Link>
        </>
      }
    >
      {!isConfigured ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Supabase is not configured locally yet. Add the environment variables before
          using the protected app.
        </div>
      ) : null}

      {authError ? (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {authError}
        </div>
      ) : null}

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
          disabled={isSubmitting || !isConfigured}
          className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in...' : 'Log in'}
        </button>
      </form>
    </AuthScene>
  )
}
