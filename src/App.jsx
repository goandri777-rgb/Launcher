import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { AuthGuard, AdminGuard } from './guards/Guards'
import Login from './pages/Login'
import Launcher from './pages/Launcher'
import AdminPanel from './pages/AdminPanel'
import AlasTransitionLoader from './components/AlasTransitionLoader'

// Loader global: cubre pantalla completa durante boot y transición post-login.
// - Boot: activo hasta que auth resuelve Y mínimo 1100ms pasaron (para que la animación hub+arco se vea completa)
// - Post-login: activo hasta que Launcher señaliza que System Online comenzó (stopEntry)
function AppLoader() {
  const { loading, transitioning } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1100)
    return () => clearTimeout(t)
  }, [])

  return (
    <AlasTransitionLoader
      active={!ready || loading || transitioning}
      label="Iniciando sistema"
    />
  )
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
