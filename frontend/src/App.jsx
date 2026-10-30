import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { PageLoader } from './components/ui'
import { useApp } from './context/AppContext'
import { homeFor } from './lib/utils'

// Code-split pages for instantaneous initial load
const Landing = lazy(() => import('./pages/Landing'))
const AuthModule = lazy(() => import('./pages/Auth').then((m) => ({ default: m })))
const DonorDashboard = lazy(() => import('./pages/DonorDashboard'))
const FormsModule = lazy(() => import('./pages/Forms').then((m) => ({ default: m })))
const ReceiverDashboard = lazy(() => import('./pages/ReceiverDashboard'))
const AdminControl = lazy(() => import('./pages/AdminControl'))
const RouteDetails = lazy(() => import('./pages/RouteDetails'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Compare = lazy(() => import('./pages/Compare'))
const Setup = lazy(() => import('./pages/Setup'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))

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
    <Suspense fallback={<PageLoader label="Loading view…" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <Suspense fallback={<PageLoader />}>
                <AuthPages page="login" />
              </Suspense>
            }
          />
          <Route
            path="/register"
            element={
              <Suspense fallback={<PageLoader />}>
                <AuthPages page="register" />
              </Suspense>
            }
          />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route
            path="/donor"
            element={
              <Guard role="donor">
                <DonorDashboard />
              </Guard>
            }
          />
          <Route
            path="/donor/donate"
            element={
              <Guard role="donor">
                <FormsPage form="donate" />
              </Guard>
            }
          />
          <Route
            path="/receiver"
            element={
              <Guard role="receiver">
                <ReceiverDashboard />
              </Guard>
            }
          />
          <Route
            path="/receiver/request"
            element={
              <Guard role="receiver">
                <FormsPage form="request" />
              </Guard>
            }
          />
          <Route
            path="/admin"
            element={
              <Guard role="admin">
                <AdminControl />
              </Guard>
            }
          />
          <Route
            path="/admin/routes"
            element={
              <Guard role="admin">
                <RouteDetails />
              </Guard>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <Guard role="admin">
                <Analytics />
              </Guard>
            }
          />
          <Route
            path="/admin/compare"
            element={
              <Guard role="admin">
                <Compare />
              </Guard>
            }
          />
          <Route
            path="/admin/setup"
            element={
              <Guard role="admin">
                <Setup />
              </Guard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function AuthPages({ page }) {
  const [Comp, setComp] = useState(null)
  useEffect(() => {
    import('./pages/Auth').then((m) => {
      setComp(() => (page === 'register' ? m.Register : m.Login))
    })
  }, [page])
  if (!Comp) return <PageLoader />
  return <Comp />
}

function FormsPage({ form }) {
  const [Comp, setComp] = useState(null)
  useEffect(() => {
    import('./pages/Forms').then((m) => {
      setComp(() => (form === 'request' ? m.RequestForm : m.DonateForm))
    })
  }, [form])
  if (!Comp) return <PageLoader />
  return <Comp />
}
