import { Navigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const EASE = [0.16, 1, 0.3, 1]

// ── Pantalla de carga ─────────────────────────────────────────────────────
function Splash() {
  return (
    <div className="h-full grid place-items-center">
      <motion.div
        style={{ display: 'flex', gap: 6 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            style={{ width: 5, height: 5, borderRadius: '50%', background: '#0B5F8D' }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.1, delay: i * 0.16, repeat: Infinity }}
          />
        ))}
      </motion.div>
    </div>
  )
}

// ── Pantalla sin sesión ───────────────────────────────────────────────────
function NoSession() {
  return (
    <div className="h-full grid place-items-center px-4"
      style={{ background: 'linear-gradient(145deg,#edf1f7 0%,#e6ecf5 55%,#edf2f8 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          background: '#ffffff',
          border: '1px solid rgba(226,232,240,0.9)',
          borderRadius: 24,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 4px 24px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)',
          textAlign: 'center',
          fontFamily: '"Inter", system-ui, sans-serif',
        }}
      >
        {/* Ícono */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
          background: '#eff6ff',
          border: '1px solid rgba(11,95,141,0.15)',
          display: 'grid', placeItems: 'center',
        }}>
          <Lock style={{ width: 22, height: 22, color: '#0B5F8D' }} />
        </div>

        {/* Logo */}
        <img
          src="/logo.png"
          alt="ALAS"
          style={{
            height: 26, width: 'auto', margin: '0 auto 18px', display: 'block',
            filter: 'brightness(0) saturate(100%) invert(24%) sepia(61%) saturate(1200%) hue-rotate(183deg) brightness(85%)',
          }}
          onError={e => { e.target.style.display = 'none' }}
        />

        <h2 style={{
          fontFamily: '"Sora", system-ui, sans-serif',
          fontWeight: 700, fontSize: 18,
          color: '#0f172a', letterSpacing: '-0.03em',
          margin: '0 0 8px',
        }}>
          Sesión cerrada
        </h2>

        <p style={{
          fontSize: 13.5, color: '#64748b',
          lineHeight: 1.55, margin: '0 0 28px',
        }}>
          Para usar el Launcher necesitás
          iniciar sesión con tu cuenta.
        </p>

        <Link
          to="/login"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '11px 0',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0B5F8D, #08486A)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            fontFamily: '"Inter", system-ui, sans-serif',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            boxShadow: '0 3px 12px rgba(11,95,141,0.28)',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Iniciar sesión
        </Link>
      </motion.div>
    </div>
  )
}

// ── AuthGuard ─────────────────────────────────────────────────────────────
export function AuthGuard({ children }) {
  const { session, profile, loading, transitioning } = useAuth()
  const location = useLocation()

  // Solo bloquear en la carga inicial (sesión desconocida).
  // Si ya hay sesión activa, no blanquear aunque loadProfile esté recargando.
  if (loading && !session) return null

  // Sin sesión: si estamos en transición post-login (startEntry activo),
  // esperar en null en vez de mostrar NoSession — el AppLoader cubre el hueco.
  if (!session) return transitioning ? null : <NoSession />

  // Cuenta bloqueada o inactiva
  if (profile && (profile.is_blocked || profile.is_active === false)) {
    return (
      <div className="h-full grid place-items-center px-6 text-center"
        style={{ background: 'linear-gradient(145deg,#edf1f7,#e6ecf5,#edf2f8)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{
            background: '#fff1f2', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 20, padding: '32px 28px', maxWidth: 340,
            fontFamily: '"Inter", system-ui, sans-serif',
          }}
        >
          <p style={{ fontFamily: '"Sora",system-ui', fontWeight: 700, fontSize: 16, color: '#dc2626', margin: '0 0 8px' }}>
            Acceso restringido
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Tu cuenta está desactivada o bloqueada.
            Contactá al administrador.
          </p>
        </motion.div>
      </div>
    )
  }

  return children
}

// ── AdminGuard ────────────────────────────────────────────────────────────
// admin → acceso total | supervisor → solo lectura | resto → redirige al launcher
export function AdminGuard({ children }) {
  const { profile, loading } = useAuth()
  // Si cargando y aún no hay perfil: mostrar spinner (nunca pantalla en blanco).
  if (loading && !profile) return <Splash />
  if (profile?.role !== 'admin' && profile?.role !== 'supervisor') return <Navigate to="/" replace />
  return children
}
