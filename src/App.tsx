import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
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
import { Settings } from './pages/Settings'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
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
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
