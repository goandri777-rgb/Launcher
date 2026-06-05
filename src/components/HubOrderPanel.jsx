import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { X, Check, GripVertical } from 'lucide-react'
import { getModuleIcon } from '../data/icons'

const EASE = [0.16, 1, 0.3, 1]

const T = {
  brand:  '#0B5F8D',
  text1:  '#1e293b',
  text2:  '#475569',
  text3:  '#94a3b8',
  border: 'rgba(226,232,240,0.85)',
}

function stateLabel(m) {
  if (m.is_blocked)         return { label: 'Sin permiso', color: '#ef4444' }
  if (m.is_active === false) return { label: 'En desarrollo', color: '#f59e0b' }
  return null
}

export default function HubOrderPanel({ modules, onSave, onClose }) {
  const [order,   setOrder]   = useState(modules)
  const [hovered, setHovered] = useState(null)

  return (
    <motion.div
      key="hub-order-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15,23,42,0.30)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'grid', placeItems: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ duration: 0.28, ease: EASE }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 360,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(28px) saturate(140%)',
          WebkitBackdropFilter: 'blur(28px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.9)',
          borderRadius: 22,
          padding: '22px 20px 18px',
          boxShadow: '0 28px 72px rgba(11,95,141,0.18), 0 4px 18px rgba(11,95,141,0.08)',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <p style={{
              margin: 0, fontSize: 15, fontWeight: 800,
              color: T.text1, fontFamily: '"Inter", sans-serif',
              letterSpacing: '-0.025em',
            }}>
              Personalizar Hub
            </p>
            <p style={{
              margin: '3px 0 0', fontSize: 11, color: T.text3,
              fontFamily: '"Inter", sans-serif',
            }}>
              Arrastrá para cambiar el orden de los módulos
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', width: 28, height: 28, borderRadius: 8,
              border: 'none', background: 'rgba(0,0,0,0.05)',
              color: T.text3, cursor: 'pointer',
              display: 'grid', placeItems: 'center',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.10)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* ── Lista reordenable ────────────────────────────────────────── */}
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setOrder}
          style={{
            listStyle: 'none', margin: 0, padding: 0,
            display: 'flex', flexDirection: 'column', gap: 5,
            maxHeight: 420, overflowY: 'auto', scrollbarWidth: 'none',
          }}
        >
          {order.map((m, i) => {
            const Icon   = getModuleIcon(m.key)
            const badge  = stateLabel(m)
            const isHov  = hovered === m.key
            return (
              <Reorder.Item
                key={m.key}
                value={m}
                style={{ borderRadius: 13, cursor: 'grab' }}
                whileDrag={{
                  scale: 1.03,
                  boxShadow: '0 12px 32px rgba(11,95,141,0.16)',
                  zIndex: 99, cursor: 'grabbing',
                }}
              >
                <div
                  onMouseEnter={() => setHovered(m.key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 11px',
                    background: isHov ? 'rgba(255,255,255,1)' : 'rgba(248,250,252,0.9)',
                    border: isHov
                      ? '1px solid rgba(11,95,141,0.20)'
                      : `1px solid ${T.border}`,
                    borderRadius: 13,
                    transition: 'background 150ms ease, border-color 150ms ease',
                    boxShadow: isHov ? '0 4px 14px rgba(11,95,141,0.07)' : 'none',
                  }}
                >
                  {/* Número */}
                  <span style={{
                    width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                    background: 'rgba(11,95,141,0.08)', color: T.brand,
                    fontSize: 9.5, fontWeight: 800,
                    fontFamily: '"JetBrains Mono", monospace',
                    display: 'grid', placeItems: 'center',
                  }}>
                    {i + 1}
                  </span>

                  {/* Icono módulo */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(11,95,141,0.07)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Icon style={{ width: 16, height: 16, color: T.brand }} />
                  </div>

                  {/* Nombre + badge */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 12.5, fontWeight: 700,
                      color: T.text1, fontFamily: '"Inter", sans-serif',
                      letterSpacing: '-0.015em',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {m.name}
                    </p>
                    {badge && (
                      <p style={{
                        margin: '2px 0 0', fontSize: 9.5, fontWeight: 600,
                        color: badge.color, fontFamily: '"Inter", sans-serif',
                      }}>
                        {badge.label}
                      </p>
                    )}
                  </div>

                  {/* Grip */}
                  <GripVertical style={{
                    width: 14, height: 14, color: T.text3,
                    opacity: isHov ? 0.6 : 0.25, flexShrink: 0,
                    transition: 'opacity 150ms ease',
                  }} />
                </div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 11,
              border: `1px solid ${T.border}`,
              background: '#fff', color: T.text2,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(order)}
            style={{
              flex: 2, padding: '9px 0', borderRadius: 11,
              border: 'none',
              background: 'linear-gradient(135deg, #0B5F8D, #08486A)',
              color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Check style={{ width: 13, height: 13 }} />
            Guardar orden
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
