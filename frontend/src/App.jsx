import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { PageLoader } from './components/ui'
import { useApp } from './context/AppContext'
import { homeFor } from './lib/utils'
import Landing from './pages/Landing'
import { Login, Register } from './pages/Auth'
import DonorDashboard from './pages/DonorDashboard'
import { DonateForm, RequestForm } from './pages/Forms'
import ReceiverDashboard from './pages/ReceiverDashboard'
import AdminControl from './pages/AdminControl'
import RouteDetails from './pages/RouteDetails'
import Analytics from './pages/Analytics'
import Compare from './pages/Compare'
import Setup from './pages/Setup'
import HowItWorks from './pages/HowItWorks'

function Guard({ role, children }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return children
}

export default function App() {
  const { ready } = useApp()
  if (!ready) return <PageLoader label="Starting SmartFeed…" />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/donor" element={<Guard role="donor"><DonorDashboard /></Guard>} />
        <Route path="/donor/donate" element={<Guard role="donor"><DonateForm /></Guard>} />
        <Route path="/receiver" element={<Guard role="receiver"><ReceiverDashboard /></Guard>} />
        <Route path="/receiver/request" element={<Guard role="receiver"><RequestForm /></Guard>} />
        <Route path="/admin" element={<Guard role="admin"><AdminControl /></Guard>} />
        <Route path="/admin/routes" element={<Guard role="admin"><RouteDetails /></Guard>} />
        <Route path="/admin/analytics" element={<Guard role="admin"><Analytics /></Guard>} />
        <Route path="/admin/compare" element={<Guard role="admin"><Compare /></Guard>} />
        <Route path="/admin/setup" element={<Guard role="admin"><Setup /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
