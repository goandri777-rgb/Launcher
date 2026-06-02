import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Settings2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useModules } from '../hooks/useModules'
import CircularLauncher from '../components/CircularLauncher'
import AlasTransitionLoader from '../components/AlasTransitionLoader'

const ROLE_LABEL = {
  admin:      'Administrador',
  operador:   'Operador',
  supervisor: 'Supervisor',
  invitado:   'Invitado',
}

const EASE = [0.16, 1, 0.3, 1]

const btnItem = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
}

// ── Tokens inline para no depender de clases dark ────────────────────────
const T = {
  border:   'rgba(226,232,240,0.85)',
  brand:    '#0B5F8D',
  text1:    '#1e293b',
  text2:    '#475569',
  text3:    '#64748b',
  surface:  '#ffffff',
  bg:       'rgba(255,255,255,0.88)',
}

export default function Launcher() {
  const { profile, signOut, stopEntry } = useAuth()
  const { modules, loading, openModule } = useModules()

  // Cuando los módulos cargan, da 400ms de margen para que System Online arranque
  // debajo del AppLoader, luego señaliza que el loader puede salir.
  useEffect(() => {
    if (loading) return
    const t = setTimeout(() => stopEntry(), 400)
    return () => clearTimeout(t)
  }, [loading, stopEntry])
  const [isExiting,   setIsExiting]   = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)

  const handleSignOut = () => setIsExiting(true)

  const handleOpenModule = useCallback(async (key) => {
    setIsLaunching(true)
    try {
      const result = await openModule(key)
      if (!result?.ok) setIsLaunching(false)
      return result
    } catch (error) {
      setIsLaunching(false)
      throw error
    }
  }, [openModule])

  const exitState = isExiting
    ? { opacity: 0, scale: 0.98,  y:  8 }
    : isLaunching
    ? { opacity: 0, scale: 0.992, y: -6 }
    : { opacity: 1, scale: 1,     y:  0 }

  return (
    <>
    <motion.div
      className="h-full flex flex-col"
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={exitState}
      exit={{ opacity: 0, y: -7, scale: 0.992, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      transition={{
        duration: (isExiting || isLaunching) ? 0.28 : 0.42,
        ease:     (isExiting || isLaunching) ? [0.4, 0, 1, 1] : [0.16, 1, 0.3, 1],
      }}
      onAnimationComplete={() => { if (isExiting) signOut() }}
    >

      {/* ════ Header ════════════════════════════════════════════════════ */}
      <motion.header
        style={{
          background: T.bg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${T.border}`,
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        }}
        className="relative z-10 grid grid-cols-[auto_1fr_auto] items-center px-6 py-3 gap-6"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        {/* Izquierda — tarjeta usuario compacta */}
        <div
          className="flex items-center gap-3"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '8px 12px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: T.brand,
            display: 'grid', placeItems: 'center',
            fontFamily: '"Sora", system-ui, sans-serif',
            fontWeight: 700, fontSize: 14,
            color: '#ffffff',
          }}>
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>

          <div>
            <p style={{
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: 600, fontSize: 13.5,
              color: T.text1,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}>
              {profile?.full_name || 'usuario'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 4px rgba(16,185,129,0.5)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: T.text3, fontFamily: '"Inter", system-ui' }}>
                {ROLE_LABEL[profile?.role] || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Centro — logo */}
        <div className="flex justify-center">
          <motion.img
            src="/logo.png"
            alt="ALAS"
            style={{
              height: 32, width: 'auto',
              filter: 'brightness(0) saturate(100%) invert(24%) sepia(61%) saturate(1200%) hue-rotate(183deg) brightness(85%)',
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </div>

        {/* Derecha — botones */}
        <motion.div
          className="flex items-center gap-2"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.06 } } }}
        >
          {profile?.role === 'admin' && (
            <motion.div variants={btnItem}>
              <Link to="/admin" className="surface-btn">
                <Settings2 style={{ width: 14, height: 14 }} />
                <span>Admin</span>
              </Link>
            </motion.div>
          )}
          <motion.div variants={btnItem}>
            <button onClick={handleSignOut} className="surface-btn danger">
              <LogOut style={{ width: 14, height: 14 }} />
              <span>Salir</span>
            </button>
          </motion.div>
        </motion.div>
      </motion.header>

      {/* ════ Main ══════════════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 grid place-items-center">
        {loading ? (
          <motion.div
            role="status"
            aria-label="Cargando sistema"
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: EASE }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(11,95,141,0.45)' }}
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1, 0.75] }}
                transition={{ duration: 1.4, delay: i * 0.20, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </motion.div>
        ) : modules.length === 0 ? (
          <motion.div
            className="text-center space-y-1"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <p style={{ fontSize: 14, color: T.text2, fontFamily: '"Inter", system-ui' }}>
              Sin módulos asignados.
            </p>
            <p style={{ fontSize: 12, color: T.text3 }}>
              Pedí acceso al administrador.
            </p>
          </motion.div>
        ) : (
          <CircularLauncher modules={modules} onOpen={handleOpenModule} />
        )}
      </main>

    </motion.div>
    <AlasTransitionLoader active={isLaunching} />
    </>
  )
}
