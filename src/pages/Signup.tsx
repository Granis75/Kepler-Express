import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AuthScene } from '../components/AuthScene'
import { TextInput } from '../components/TextInput'
import { useAuthState } from '../lib/auth'
import { publicRoutes } from '../lib/routes'

export function Signup() {
  const { signUp, isConfigured } = useAuthState()
  const [fullName, setFullName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAuthError(null)
    setSuccessMessage(null)

    try {
      const result = await signUp({
        fullName: fullName.trim(),
        organizationName: organizationName.trim(),
        email: email.trim(),
        password,
      })

      setSuccessMessage(
        result.emailConfirmationRequired
          ? 'Account created. Confirm your email, then log in.'
          : 'Workspace created. Redirecting to your account...'
      )
      toast.success(
        result.emailConfirmationRequired
          ? 'Account created. Confirm your email before logging in.'
          : 'Workspace created successfully.'
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create your account.'
      setAuthError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthScene
      title="Create account"
      subtitle="Create the authenticated workspace shell that Supabase will bootstrap for your organization."
      footer={
        <>
          Already have an account?{' '}
          <Link to={publicRoutes.login} className="font-medium text-teal-700 hover:text-teal-800">
            Log in
          </Link>
        </>
      }
    >
      {!isConfigured ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Supabase is not configured locally yet. Add the environment variables before
          creating a workspace from this app.
        </div>
      ) : null}

      {authError ? (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {authError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
          required
        />
        <TextInput
          label="Organization"
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
          placeholder="Kepler Express"
          autoComplete="organization"
          required
        />
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <button
          type="submit"
          disabled={isSubmitting || !isConfigured}
          className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthScene>
  )
}
