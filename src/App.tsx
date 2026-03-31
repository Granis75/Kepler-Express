import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useAuthState } from './lib/auth'
import { AppProviders } from './providers'
import { Dashboard } from './pages/Dashboard'
import { Missions } from './pages/Missions'
import { MissionDetail } from './pages/MissionDetail'
import { MissionCreate } from './pages/MissionCreate'
import { MissionEdit } from './pages/MissionEdit'
import { Clients } from './pages/Clients'
import { Drivers } from './pages/Drivers'
import { Vehicles } from './pages/Vehicles'
import { VehicleCreate } from './pages/VehicleCreate'
import { VehicleDetail } from './pages/VehicleDetail'
import { VehicleEdit } from './pages/VehicleEdit'
import { Expenses } from './pages/Expenses'
import { Invoices } from './pages/Invoices'
import { InvoiceCreate } from './pages/InvoiceCreate'
import { InvoiceDetail } from './pages/InvoiceDetail'
import { InvoiceEdit } from './pages/InvoiceEdit'
import { Login } from './pages/Login'
import { Settings } from './pages/Settings'

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-5">
      <div className="bg-white border border-gray-200 rounded-lg px-6 py-5 text-center shadow-sm">
        <p className="text-sm text-gray-500">Checking Supabase session...</p>
      </div>
    </div>
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

  return '/'
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

function ProtectedAppShell() {
  const { authReady, user } = useAuthState()
  const location = useLocation()

  if (!authReady) {
    return <AuthLoadingScreen />
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    )
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function App() {
  return (
    <AppProviders>
      <Router>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedAppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/missions/new" element={<MissionCreate />} />
            <Route path="/missions/:id" element={<MissionDetail />} />
            <Route path="/missions/:id/edit" element={<MissionEdit />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/vehicles/new" element={<VehicleCreate />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            <Route path="/vehicles/:id/edit" element={<VehicleEdit />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceCreate />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AppProviders>
  )
}

export default App
