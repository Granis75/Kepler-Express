import { Link } from 'react-router-dom'
import { AuthScene } from '../components/AuthScene'
import { publicRoutes } from '../lib/routes'

export function Signup() {
  return (
    <AuthScene
      title="Private access only"
      subtitle="Open signup is disabled. Kepler Express provisions authorized logistics operator accounts directly."
      footer={
        <>
          Already authorized?{' '}
          <Link to={publicRoutes.login} className="font-medium text-teal-700 hover:text-teal-800">
            Log in
          </Link>
        </>
      }
    >
      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-700">
        Request a demo or access review through Kepler Express. This keeps the workflow private,
        tenant-scoped, and limited to approved logistics teams.
      </div>
      <a
        href="mailto:contact@keplerexpress.com?subject=Kepler%20Express%20access%20request"
        className="btn-primary mt-5 w-full"
      >
        Request demo / contact
      </a>
    </AuthScene>
  )
}
