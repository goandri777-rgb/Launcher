import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LogOut, Settings2, Lock, Hammer, ChevronRight } from 'lucide-react'
import { getModuleIcon } from '../data/icons'

const EASE = [0.16, 1, 0.3, 1]

function stateOf(m) {
  if (m.is_blocked) return 'blocked'
  if (m.is_active === false) return 'inactive'
  return 'active'
}

/**
 * Vista móvil PRO del launcher: header compacto + grilla de módulos.
 * Azul/blanco, animaciones framer-motion. Reemplaza al CircularLauncher
 * (radial) que en pantallas chicas queda incómodo.
 */
export default function MobileHub({ profile, modules, onOpen, onSignOut, canAdmin, roleLabel, onAdminNav }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header compacto */}
      <motion.header
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px) saturate(120%)', WebkitBackdropFilter: 'blur(12px) saturate(120%)',
          borderBottom: '1px solid rgba(11,95,141,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#1478b8,#0B5F8D)', display: 'grid', placeItems: 'center',
            fontFamily: '"Sora",system-ui,sans-serif', fontWeight: 700, fontSize: 16, color: '#fff',
            boxShadow: '0 3px 10px rgba(11,95,141,0.28)',
          }}>{(profile?.full_name || 'U').charAt(0).toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1e293b', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'usuario'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#64748b', fontFamily: '"JetBrains Mono",monospace', fontWeight: 500 }}>{roleLabel || '—'}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {canAdmin && (
            <Link to="/admin" onClick={onAdminNav} aria-label="Admin" style={{
              width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center',
              background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(11,95,141,0.18)', color: '#0B5F8D',
            }}><Settings2 style={{ width: 18, height: 18 }} /></Link>
          )}
          <button onClick={onSignOut} aria-label="Cerrar sesión" style={{
            width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center',
            background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer',
          }}><LogOut style={{ width: 18, height: 18 }} /></button>
        </div>
      </motion.header>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.06 }}
        style={{ flexShrink: 0, padding: '16px 16px 8px' }}
      >
        <img src="/logo.png" alt="ALAS" style={{ height: 26, width: 'auto', display: 'block', marginBottom: 10, filter: 'brightness(0) saturate(100%) invert(24%) sepia(61%) saturate(1200%) hue-rotate(183deg) brightness(85%)' }} />
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#64748b', fontFamily: '"JetBrains Mono",monospace' }}>Tus módulos</p>
      </motion.div>

      {/* Grilla de módulos */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 16px 24px' }}>
        {modules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Sin módulos asignados.</p>
            <p style={{ fontSize: 12, margin: '4px 0 0' }}>Pedí acceso al administrador.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}
          >
            {modules.map((m) => {
              const st = stateOf(m)
              const Icon = getModuleIcon(m.key)
              const disabled = st !== 'active'
              return (
                <motion.button
                  key={m.key}
                  variants={{ hidden: { opacity: 0, y: 16, scale: 0.96 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE } } }}
                  whileTap={disabled ? undefined : { scale: 0.96 }}
                  onClick={() => { if (!disabled) onOpen(m.key) }}
                  disabled={disabled}
                  style={{
                    position: 'relative', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 18,
                    background: disabled ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.92)',
                    border: '1px solid rgba(11,95,141,0.12)',
                    boxShadow: disabled ? 'none' : '0 8px 22px rgba(11,95,141,0.10)',
                    opacity: disabled ? 0.7 : 1,
                    minHeight: 118,
                  }}
                >
                  <span style={{
                    width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center',
                    background: disabled ? 'rgba(100,116,139,0.12)' : 'linear-gradient(135deg,#1478b8,#0B5F8D)',
                    color: disabled ? '#94a3b8' : '#fff',
                    boxShadow: disabled ? 'none' : '0 6px 16px rgba(20,120,184,0.30)',
                  }}>
                    <Icon style={{ width: 24, height: 24 }} />
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', lineHeight: 1.25 }}>{m.name}</span>
                  {st === 'active' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#0B5F8D', fontFamily: '"JetBrains Mono",monospace' }}>
                      Abrir <ChevronRight style={{ width: 13, height: 13 }} />
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: '#94a3b8', fontFamily: '"JetBrains Mono",monospace', textTransform: 'uppercase' }}>
                      {st === 'blocked' ? <><Lock style={{ width: 12, height: 12 }} /> Sin permiso</> : <><Hammer style={{ width: 12, height: 12 }} /> En desarrollo</>}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
