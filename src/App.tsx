import { Suspense, lazy } from 'react'
import {
  BrowserRouter as Router,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import { Layout } from './components/Layout'
import { useAuthState } from './lib/auth'
import { appRoutes, getClientDetailRoute, publicRoutes } from './lib/routes'
import { useWorkspaceState } from './lib/workspace'

const Landing = lazy(() => import('./pages/Landing').then((module) => ({ default: module.Landing })))
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })))
const Signup = lazy(() => import('./pages/Signup').then((module) => ({ default: module.Signup })))
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard }))
)
const Clients = lazy(() => import('./pages/Clients').then((module) => ({ default: module.Clients })))
const ClientDetail = lazy(() =>
  import('./pages/ClientDetail').then((module) => ({ default: module.ClientDetail }))
)
const Missions = lazy(() =>
  import('./pages/Missions').then((module) => ({ default: module.Missions }))
)
const Expenses = lazy(() =>
  import('./pages/Expenses').then((module) => ({ default: module.Expenses }))
)
const Invoices = lazy(() =>
  import('./pages/Invoices').then((module) => ({ default: module.Invoices }))
)
const Settings = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.Settings }))
)

function FullscreenState({
  eyebrow,
  title,
  message,
  tone = 'default',
  actions,
}: {
  eyebrow: string
  title: string
  message: string
  tone?: 'default' | 'warning' | 'danger'
  actions?: React.ReactNode
}) {
  const toneClasses =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-stone-200 bg-white text-stone-900'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.08),_transparent_24%),linear-gradient(180deg,_#faf8f3_0%,_#f6f2eb_100%)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <div className={`w-full rounded-[2rem] border p-8 shadow-sm ${toneClasses}`}>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{eyebrow}</p>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-stone-600">{message}</p>
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </div>
  )
}

function AuthLoadingScreen() {
  return (
    <FullscreenState
      eyebrow="Authentication"
      title="Checking your session"
      message="We are restoring the current Supabase session before opening the workspace."
    />
  )
}

function RouteLoadingScreen() {
  return (
    <FullscreenState
      eyebrow="Navigation"
      title="Opening workspace view"
      message="We are loading the next page."
    />
  )
}

function getRedirectTarget(locationState: unknown) {
  if (
    locationState &&
    typeof locationState === 'object' &&
    'from' in locationState &&
    typeof locationState.from === 'string'
  ) {
    return locationState.from
  }

  return appRoutes.dashboard
}

function PublicOnlyRoute() {
  const { authReady, user } = useAuthState()
  const location = useLocation()

  if (!authReady) {
    return <AuthLoadingScreen />
  }

  if (user) {
    return <Navigate to={getRedirectTarget(location.state)} replace />
  }

  return <Outlet />
}

function ProtectedRoute() {
  const { authReady, isConfigured, user } = useAuthState()
  const location = useLocation()

  if (!authReady) {
    return <AuthLoadingScreen />
  }

  if (!isConfigured) {
    return (
      <FullscreenState
        eyebrow="Configuration"
        title="Supabase is not configured"
        message="Add the Supabase URL and anonymous key to the local environment before using the protected workspace."
        tone="warning"
      />
    )
  }

  if (!user) {
    return (
      <Navigate
        to={publicRoutes.login}
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    )
  }

  return <Outlet />
}

function WorkspaceGate() {
  const { signOut } = useAuthState()
  const { workspaceReady, isLoading, hasWorkspace, error, reload } = useWorkspaceState()

  if (!workspaceReady || isLoading) {
    return (
      <FullscreenState
        eyebrow="Workspace"
        title="Loading your workspace"
        message="We are checking the profile and organization attached to this account."
      />
    )
  }

  if (!hasWorkspace) {
    return (
      <FullscreenState
        eyebrow="Workspace"
        title="Workspace unavailable"
        message={
          error ??
          'This account is authenticated, but the workspace is not ready yet. Reload once the profile bootstrap has completed.'
        }
        tone={error ? 'danger' : 'warning'}
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                void reload()
              }}
              className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Retry workspace load
            </button>
            <button
              type="button"
              onClick={() => {
                void signOut()
              }}
              className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400"
            >
              Sign out
            </button>
          </>
        }
      />
    )
  }

  return <Outlet />
}

function AppShell() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function AppIndexRedirect() {
  return <Navigate to={appRoutes.dashboard} replace />
}

function LegacyClientDetailRedirect() {
  const { id } = useParams<{ id: string }>()

  return <Navigate to={id ? getClientDetailRoute(id) : appRoutes.clients} replace />
}

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteLoadingScreen />}>
        <Routes>
          <Route path={publicRoutes.landing} element={<Landing />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path={publicRoutes.login} element={<Login />} />
            <Route path={publicRoutes.signup} element={<Signup />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path={appRoutes.home} element={<AppIndexRedirect />} />

            <Route element={<WorkspaceGate />}>
              <Route element={<AppShell />}>
                <Route path={appRoutes.dashboard} element={<Dashboard />} />
                <Route path={appRoutes.clients} element={<Clients />} />
                <Route path={appRoutes.clientDetail} element={<ClientDetail />} />
                <Route path={appRoutes.missions} element={<Missions />} />
                <Route path={appRoutes.expenses} element={<Expenses />} />
                <Route path={appRoutes.invoices} element={<Invoices />} />
                <Route path={appRoutes.settings} element={<Settings />} />
              </Route>
            </Route>
          </Route>

          <Route path="/dashboard" element={<Navigate to={appRoutes.dashboard} replace />} />
          <Route path="/clients" element={<Navigate to={appRoutes.clients} replace />} />
          <Route path="/clients/:id" element={<LegacyClientDetailRedirect />} />
          <Route path="/missions" element={<Navigate to={appRoutes.missions} replace />} />
          <Route path="/missions/new" element={<Navigate to={appRoutes.missions} replace />} />
          <Route path="/missions/:id" element={<Navigate to={appRoutes.missions} replace />} />
          <Route path="/missions/:id/edit" element={<Navigate to={appRoutes.missions} replace />} />
          <Route path="/expenses" element={<Navigate to={appRoutes.expenses} replace />} />
          <Route path="/invoices" element={<Navigate to={appRoutes.invoices} replace />} />
          <Route path="/invoices/new" element={<Navigate to={appRoutes.invoices} replace />} />
          <Route path="/invoices/:id" element={<Navigate to={appRoutes.invoices} replace />} />
          <Route path="/invoices/:id/edit" element={<Navigate to={appRoutes.invoices} replace />} />
          <Route path="/drivers" element={<Navigate to={appRoutes.dashboard} replace />} />
          <Route path="/vehicles" element={<Navigate to={appRoutes.dashboard} replace />} />
          <Route path="/vehicles/new" element={<Navigate to={appRoutes.dashboard} replace />} />
          <Route path="/vehicles/:id" element={<Navigate to={appRoutes.dashboard} replace />} />
          <Route path="/vehicles/:id/edit" element={<Navigate to={appRoutes.dashboard} replace />} />
          <Route path="*" element={<Navigate to={publicRoutes.landing} replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
