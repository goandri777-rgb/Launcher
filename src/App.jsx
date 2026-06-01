import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { AuthGuard, AdminGuard } from './guards/Guards'
import Login from './pages/Login'
import Launcher from './pages/Launcher'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Requiere sesión */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <Launcher />
              </AuthGuard>
            }
          />

          {/* Requiere sesión + rol admin */}
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
      </BrowserRouter>
    </AuthProvider>
  )
}
