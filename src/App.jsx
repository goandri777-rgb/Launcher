import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { AuthGuard, AdminGuard } from './guards/Guards'
import Login from './pages/Login'
import Launcher from './pages/Launcher'
import AdminPanel from './pages/AdminPanel'
import AlasTransitionLoader from './components/AlasTransitionLoader'

// Solo activo durante la transición post-login.
// No cubre el boot para no bloquear el retorno desde módulos SSO.
function AppLoader() {
  const { transitioning } = useAuth()
  return <AlasTransitionLoader active={transitioning} label="Iniciando sistema" />
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <Launcher />
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <AdminGuard>
                <AdminPanel />
              </AdminGuard>
            </AuthGuard>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLoader />
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
