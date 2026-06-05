import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, X, ChevronLeft, ChevronRight, GripVertical, FolderKanban, Check } from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────────────────
const EASE = [0.16, 1, 0.3, 1]

const STATUS = [
  { value: 'trabajando',  label: 'Trabajando',  color: '#10b981' },
  { value: 'en-pruebas',  label: 'En Pruebas',  color: '#f59e0b' },
  { value: 'pausado',     label: 'Pausado',      color: '#94a3b8' },
]

const statusColor  = (v) => STATUS.find(s => s.value === v)?.color  ?? '#94a3b8'
const statusLabel  = (v) => STATUS.find(s => s.value === v)?.label  ?? v

// ── Persistencia ──────────────────────────────────────────────────────────────
function load() {
  try { return JSON.parse(localStorage.getItem('alas.sidebar.projects') ?? '[]') } catch { return [] }
}
function persist(list) {
  try { localStorage.setItem('alas.sidebar.projects', JSON.stringify(list)) } catch {}
}

// ── Estilos reutilizables ─────────────────────────────────────────────────────
const T = {
  brand:    '#0B5F8D',
  text1:    '#1e293b',
  text2:    '#475569',
  text3:    '#94a3b8',
  border:   'rgba(11,95,141,0.10)',
  surface:  'rgba(255,255,255,0.70)',
  danger:   '#ef4444',
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ProjectsSidebar() {
  const [open,      setOpen]      = useState(true)
  const [projects,  setProjects]  = useState(load)
  const [adding,    setAdding]    = useState(false)
  const [newName,   setNewName]   = useState('')
  const [newStatus, setNewStatus] = useState('trabajando')
  const [hovered,   setHovered]   = useState(null)
  const nameInputRef = useRef(null)

  const update = useCallback((list) => {
    setProjects(list)
    persist(list)
  }, [])

  const handleAdd = () => {
    if (!newName.trim()) return
    update([...projects, {
      id:        crypto.randomUUID(),
      name:      newName.trim(),
      status:    newStatus,
      createdAt: new Date().toISOString(),
    }])
    setNewName('')
    setNewStatus('trabajando')
    setAdding(false)
  }

  const handleDelete = (id) => update(projects.filter(p => p.id !== id))

  const handleCycleStatus = (id) => {
    update(projects.map(p => {
      if (p.id !== id) return p
      const idx  = STATUS.findIndex(s => s.value === p.status)
      const next = STATUS[(idx + 1) % STATUS.length]
      return { ...p, status: next.value }
    }))
  }

  const openAdding = () => {
    setAdding(true)
    setTimeout(() => nameInputRef.current?.focus(), 80)
  }

  return (
    <motion.aside
      animate={{ width: open ? 272 : 52 }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{
        flexShrink: 0,
        height: '100%',
        background: 'rgba(255,255,255,0.52)',
        backdropFilter: 'blur(18px) saturate(130%)',
        WebkitBackdropFilter: 'blur(18px) saturate(130%)',
        borderRight: `1px solid ${T.border}`,
        boxShadow: '2px 0 16px rgba(11,95,141,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 5,
        userSelect: 'none',
      }}
    >
      {/* ── Toggle ──────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title={open ? 'Colapsar panel' : 'Expandir panel'}
        style={{
          position: 'absolute', top: 14, right: 10,
          width: 28, height: 28, borderRadius: 8, border: 'none',
          background: 'rgba(11,95,141,0.07)', color: T.brand,
          display: 'grid', placeItems: 'center', cursor: 'pointer', zIndex: 2,
          transition: 'background 150ms ease',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(11,95,141,0.14)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(11,95,141,0.07)'}
      >
        {open
          ? <ChevronLeft  style={{ width: 14, height: 14 }} />
          : <ChevronRight style={{ width: 14, height: 14 }} />
        }
      </button>

      {/* ── Contenido expandido ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.25 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 272 }}
          >
            {/* Header */}
            <div style={{
              padding: '18px 16px 12px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 8,
              paddingRight: 48,
            }}>
              <FolderKanban style={{ width: 15, height: 15, color: T.brand, flexShrink: 0 }} />
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em',
                textTransform: 'uppercase', color: T.brand,
              }}>
                Proyectos
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 10, fontWeight: 700,
                background: 'rgba(11,95,141,0.10)',
                color: T.brand, borderRadius: 99, padding: '2px 8px',
                fontFamily: '"Inter", sans-serif',
              }}>
                {projects.length}
              </span>
            </div>

            {/* Lista reordenable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 0', scrollbarWidth: 'none' }}>
              {projects.length === 0 && !adding && (
                <div style={{
                  textAlign: 'center', padding: '32px 16px',
                  color: T.text3, fontSize: 12, lineHeight: 1.6,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Sin proyectos aún.<br />
                  <span style={{ color: T.brand, fontWeight: 600, cursor: 'pointer' }} onClick={openAdding}>
                    Añadí el primero
                  </span>
                </div>
              )}

              <Reorder.Group
                axis="y"
                values={projects}
                onReorder={update}
                style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {projects.map((p) => (
                  <Reorder.Item
                    key={p.id}
                    value={p}
                    style={{ borderRadius: 14, cursor: 'grab' }}
                    whileDrag={{
                      scale: 1.03,
                      boxShadow: '0 16px 32px rgba(11,95,141,0.18)',
                      zIndex: 99,
                      cursor: 'grabbing',
                    }}
                  >
                    <div
                      onMouseEnter={() => setHovered(p.id)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: hovered === p.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.78)',
                        border: hovered === p.id
                          ? `1px solid ${statusColor(p.status)}40`
                          : '1px solid rgba(226,232,240,0.85)',
                        borderRadius: 14,
                        padding: '11px 12px 10px',
                        transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                        boxShadow: hovered === p.id
                          ? `0 6px 20px rgba(11,95,141,0.09), 0 0 0 3px ${statusColor(p.status)}12`
                          : '0 2px 8px rgba(11,95,141,0.04)',
                        position: 'relative',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                    >
                      {/* Fila superior: grip + nombre + eliminar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                        <GripVertical style={{
                          width: 12, height: 12, color: T.text3, flexShrink: 0,
                          opacity: hovered === p.id ? 0.6 : 0,
                          transition: 'opacity 150ms ease',
                        }} />

                        <span style={{
                          flex: 1, fontSize: 12.5, fontWeight: 700,
                          color: T.text1, fontFamily: '"Inter", sans-serif',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          letterSpacing: '-0.015em', lineHeight: 1.3,
                        }}>
                          {p.name}
                        </span>

                        <button
                          onPointerDown={e => e.stopPropagation()}
                          onClick={() => handleDelete(p.id)}
                          title="Eliminar proyecto"
                          style={{
                            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                            border: 'none', background: 'rgba(239,68,68,0.08)',
                            color: T.danger, cursor: 'pointer',
                            display: 'grid', placeItems: 'center',
                            opacity: hovered === p.id ? 1 : 0,
                            transition: 'opacity 120ms ease, background 120ms ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        >
                          <X style={{ width: 10, height: 10 }} />
                        </button>
                      </div>

                      {/* Fila inferior: dot de estado + etiqueta legible */}
                      <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => handleCycleStatus(p.id)}
                        title="Clic para cambiar estado"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          border: 'none', background: `${statusColor(p.status)}14`,
                          borderRadius: 99, padding: '3px 9px 3px 7px',
                          cursor: 'pointer',
                          transition: 'background 150ms ease, transform 150ms ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${statusColor(p.status)}26`; e.currentTarget.style.transform = 'scale(1.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${statusColor(p.status)}14`; e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          background: statusColor(p.status),
                          boxShadow: `0 0 5px ${statusColor(p.status)}90`,
                        }} />
                        <span style={{
                          fontSize: 10.5, fontWeight: 600,
                          color: statusColor(p.status),
                          fontFamily: '"Inter", sans-serif',
                          letterSpacing: '-0.01em',
                        }}>
                          {statusLabel(p.status)}
                        </span>
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {/* Formulario inline añadir */}
              <AnimatePresence>
                {adding && (
                  <motion.div
                    key="add-form"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      background: 'rgba(255,255,255,0.92)',
                      border: `1px solid rgba(11,95,141,0.20)`,
                      borderRadius: 14, padding: '12px 12px 10px',
                      display: 'flex', flexDirection: 'column', gap: 10,
                      boxShadow: '0 4px 16px rgba(11,95,141,0.08)',
                    }}>
                      {/* Input nombre */}
                      <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="Nombre del proyecto..."
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          border: '1px solid rgba(226,232,240,0.9)',
                          borderRadius: 9, padding: '8px 10px',
                          fontSize: 12.5, fontFamily: '"Inter", sans-serif',
                          color: T.text1, outline: 'none',
                          background: '#ffffff',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(11,95,141,0.40)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(226,232,240,0.9)'}
                      />

                      {/* Selector estado */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {STATUS.map(s => (
                          <button
                            key={s.value}
                            onClick={() => setNewStatus(s.value)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '4px 9px', borderRadius: 99, border: 'none',
                              background: newStatus === s.value ? `${s.color}20` : 'rgba(0,0,0,0.04)',
                              color: newStatus === s.value ? s.color : T.text3,
                              fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
                              fontFamily: '"Inter", sans-serif',
                              outline: newStatus === s.value ? `1.5px solid ${s.color}50` : 'none',
                              transition: 'all 150ms ease',
                            }}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {/* Botones guardar / cancelar */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={handleAdd}
                          disabled={!newName.trim()}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            padding: '7px 0', borderRadius: 9, border: 'none',
                            background: newName.trim() ? `linear-gradient(135deg, #0B5F8D, #08486A)` : 'rgba(0,0,0,0.06)',
                            color: newName.trim() ? '#fff' : T.text3,
                            fontSize: 12, fontWeight: 700, cursor: newName.trim() ? 'pointer' : 'not-allowed',
                            fontFamily: '"Inter", sans-serif',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <Check style={{ width: 12, height: 12 }} />
                          Añadir
                        </button>
                        <button
                          onClick={() => { setAdding(false); setNewName(''); }}
                          style={{
                            width: 34, borderRadius: 9, border: '1px solid rgba(226,232,240,0.9)',
                            background: '#fff', color: T.text3, cursor: 'pointer',
                            display: 'grid', placeItems: 'center',
                          }}
                        >
                          <X style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer — botón añadir */}
            {!adding && (
              <div style={{ padding: '10px 10px 14px', borderTop: `1px solid ${T.border}`, marginTop: 8 }}>
                <button
                  onClick={openAdding}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '9px 0', borderRadius: 12,
                    border: '1.5px dashed rgba(11,95,141,0.25)',
                    background: 'transparent', color: T.brand,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: '"Inter", sans-serif', letterSpacing: '-0.01em',
                    transition: 'background 150ms ease, border-color 150ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,95,141,0.05)'; e.currentTarget.style.borderColor = 'rgba(11,95,141,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(11,95,141,0.25)' }}
                >
                  <Plus style={{ width: 13, height: 13 }} />
                  Nuevo proyecto
                </button>
              </div>
            )}

            {/* Leyenda de estados */}
            <div style={{
              padding: '8px 14px 14px',
              display: 'flex', flexWrap: 'wrap', gap: '6px 10px',
            }}>
              {STATUS.map(s => (
                <div key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 9.5, color: T.text3, fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Vista colapsada — solo dots de color ─────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.15 } }}
            exit={{ opacity: 0 }}
            style={{
              paddingTop: 56, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 10,
            }}
          >
            {projects.map(p => (
              <div
                key={p.id}
                title={`${p.name} · ${statusLabel(p.status)}`}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: statusColor(p.status),
                  boxShadow: `0 0 7px ${statusColor(p.status)}90`,
                  cursor: 'default',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
