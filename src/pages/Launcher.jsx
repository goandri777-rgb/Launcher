import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Settings2, Lock } from 'lucide-react'
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
  const { profile, loading: authLoading, signOut, stopEntry } = useAuth()
  const { modules, loading: modulesLoading, openModule } = useModules()

  // El AppLoader se oculta solo cuando AMBOS terminaron: módulos Y perfil.
  // Evita que el usuario pueda clicar ADMIN antes de que profile esté listo.
  useEffect(() => {
    if (modulesLoading || authLoading) return
    const t = setTimeout(() => {
      stopEntry();
    }, 400)
    return () => clearTimeout(t)
  }, [modulesLoading, authLoading, stopEntry])
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
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderBottom: '1px solid rgba(11, 95, 141, 0.15)',
          boxShadow: '0 8px 32px 0 rgba(11, 95, 141, 0.04), 0 1px 0 0 rgba(255, 255, 255, 0.35) inset',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          zIndex: 10,
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        {/* Izquierda — tarjeta usuario */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255, 255, 255, 0.65)',
            border: '1px solid rgba(11, 95, 141, 0.12)',
            borderRadius: 14,
            padding: '10px 16px',
            boxShadow: '0 4px 12px rgba(11, 95, 141, 0.04)',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: 'linear-gradient(135deg, #0B5F8D, #08486A)',
            display: 'grid', placeItems: 'center',
            fontFamily: '"Sora", system-ui, sans-serif',
            fontWeight: 700, fontSize: 16,
            color: '#ffffff',
            boxShadow: '0 3px 10px rgba(11, 95, 141, 0.25)',
          }}>
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>

          <div>
            <p style={{
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: 600, fontSize: 14,
              color: T.text1,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              margin: 0,
            }}>
              {profile?.full_name || 'usuario'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px rgba(16,185,129,0.55)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: T.text3, fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>
                {ROLE_LABEL[profile?.role] || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Centro — logo absolutamente centrado */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}>
          <motion.img
            src="/logo.png"
            alt="ALAS"
            style={{
              height: 34, width: 'auto', display: 'block',
              filter: 'brightness(0) saturate(100%) invert(24%) sepia(61%) saturate(1200%) hue-rotate(183deg) brightness(85%)',
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </div>

        {/* Derecha — botones */}
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.06 } } }}
        >
          {(() => {
            const canAccess = profile?.role === 'admin'
            return (
              <motion.div variants={btnItem}>
                {canAccess ? (
                  <Link to="/admin" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.75)',
                    border: '1px solid rgba(11, 95, 141, 0.18)',
                    boxShadow: '0 2px 10px rgba(11, 95, 141, 0.07)',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em',
                    color: '#0B5F8D', textDecoration: 'none',
                    transition: 'all 150ms ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f7ff'; e.currentTarget.style.borderColor = 'rgba(11,95,141,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor = 'rgba(11,95,141,0.18)' }}
                  >
                    <Settings2 style={{ width: 15, height: 15, color: '#0B5F8D' }} />
                    <span>ADMIN // CONTROL</span>
                  </Link>
                ) : (
                  <div title="Sin permisos de acceso" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.40)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em',
                    color: '#94a3b8', cursor: 'not-allowed',
                    opacity: 0.6,
                  }}>
                    <Lock style={{ width: 13, height: 13 }} />
                    <span>ADMIN // CONTROL</span>
                  </div>
                )}
              </motion.div>
            )
          })()}
          <motion.div variants={btnItem}>
            <button onClick={handleSignOut} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.75)',
              border: '1px solid rgba(239, 68, 68, 0.18)',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.06)',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em',
              color: '#ef4444', cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff1f1'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)' }}
            >
              <LogOut style={{ width: 15, height: 15 }} />
              <span>CERRAR SESIÓN</span>
            </button>
          </motion.div>
        </motion.div>
      </motion.header>

      {/* ════ Main ══════════════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 grid place-items-center">
        {loading ? (
          null
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
    <AlasTransitionLoader active={isLaunching} label="Abriendo módulo" />
    </>
  )
}
