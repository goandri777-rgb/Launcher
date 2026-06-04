import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { AuthGuard, AdminGuard } from './guards/Guards'
import Login from './pages/Login'
import Launcher from './pages/Launcher'
import AdminPanel from './pages/AdminPanel'
import AlasTransitionLoader from './components/AlasTransitionLoader'

// Delay entre "datos listos" y "loader empieza a salir"
// Permite que GSAP construya hub + líneas antes de revelar el launcher
const REVEAL_DELAY_MS = 500

function AppLoader() {
  const { appBooting, transitioning } = useAuth()
  const [loaderVisible, setLoaderVisible] = useState(true)

  useEffect(() => {
    if (appBooting || transitioning) {
      setLoaderVisible(true)
      return
    }
    const t = setTimeout(() => setLoaderVisible(false), REVEAL_DELAY_MS)
    return () => clearTimeout(t)
  }, [appBooting, transitioning])

  const label = appBooting ? "Iniciando sistema" : "Iniciando panel"
  return <AlasTransitionLoader active={loaderVisible} label={label} />
}

// Sin AnimatePresence en Routes: evita que el Routes saliente reciba la nueva
// location y renderice la página destino durante la animación de salida,
// causando doble render (dos AdminPanel simultáneos → pantalla vacía/corrupta).
// Cada página maneja su propia animación de entrada via Framer Motion initial/animate.
function AppRoutes() {
  return (
    <Routes>
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
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLoader />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
