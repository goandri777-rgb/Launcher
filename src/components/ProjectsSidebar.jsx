import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, Reorder, useReducedMotion } from 'framer-motion'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  GripVertical,
  LayoutGrid,
  LogOut,
  Plus,
  Settings2,
  X,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const EASE = [0.16, 1, 0.3, 1]

const STATUS = [
  { value: 'trabajando', label: 'Trabajando', color: '#34d399' },
  { value: 'en-pruebas', label: 'En pruebas', color: '#fbbf24' },
  { value: 'pausado', label: 'Pausado', color: '#94a3b8' },
]

const statusData = (value) => STATUS.find((status) => status.value === value) || STATUS[0]

export default function ProjectsSidebar({
  open,
  setOpen,
  roleLabel,
  editMode,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSignOut,
  onAdminNav,
}) {
  const { profile } = useAuth()
  const reduceMotion = useReducedMotion()
  const isAdmin = profile?.role === 'admin'

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newStatus, setNewStatus] = useState('trabajando')
  const [saveError, setSaveError] = useState('')
  const [hovered, setHovered] = useState(null)
  const nameInputRef = useRef(null)
  const refetchTimer = useRef(null)

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('sidebar_projects')
      .select('*')
      .order('position')

    if (!error && data) setProjects(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProjects()
    const channel = supabase
      .channel('sidebar_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sidebar_projects' }, () => {
        clearTimeout(refetchTimer.current)
        refetchTimer.current = setTimeout(fetchProjects, 300)
      })
      .subscribe()

    return () => {
      clearTimeout(refetchTimer.current)
      supabase.removeChannel(channel)
    }
  }, [fetchProjects])

  const openAdding = () => {
    setSaveError('')
    setAdding(true)
    setTimeout(() => nameInputRef.current?.focus(), 80)
  }

  const handleAdd = async () => {
    const cleanName = newName.trim()
    if (!cleanName || !isAdmin) return

    setSaveError('')
    const maxPosition = projects.length
      ? Math.max(...projects.map((project) => Number(project.position) || 0)) + 1
      : 0
    const { data, error } = await supabase
      .from('sidebar_projects')
      .insert({ name: cleanName, status: newStatus, position: maxPosition })
      .select()
      .single()

    if (error) {
      setSaveError(error.message)
      return
    }

    setProjects((current) => [...current, data])
    setNewName('')
    setNewStatus('trabajando')
    setAdding(false)
  }

  const handleDelete = async (id) => {
    if (!isAdmin) return
    const previous = projects
    setProjects((current) => current.filter((project) => project.id !== id))
    const { error } = await supabase.from('sidebar_projects').delete().eq('id', id)
    if (error) setProjects(previous)
  }

  const handleCycleStatus = async (id) => {
    if (!isAdmin) return
    const project = projects.find((item) => item.id === id)
    if (!project) return
    const currentIndex = STATUS.findIndex((status) => status.value === project.status)
    const nextStatus = STATUS[(currentIndex + 1) % STATUS.length]
    setProjects((current) => current.map((item) => (
      item.id === id ? { ...item, status: nextStatus.value } : item
    )))
    await supabase.from('sidebar_projects').update({ status: nextStatus.value }).eq('id', id)
  }

  const handleReorder = useCallback(async (newOrder) => {
    if (!isAdmin) return
    setProjects(newOrder)
    await Promise.all(newOrder.map((project, index) => (
      supabase.from('sidebar_projects').update({ position: index }).eq('id', project.id)
    )))
  }, [isAdmin])

  const initial = (profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase()

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            className="launcher-panel-trigger"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.7, x: 18 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 18 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
            onClick={() => setOpen(true)}
            aria-label="Abrir panel de operaciones"
          >
            <ChevronLeft aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            className="launcher-side-panel"
            initial={reduceMotion ? false : { x: 370, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 370, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.52, ease: EASE }}
            aria-label="Panel de operaciones"
          >
            <div className="side-panel-profile">
              <button
                type="button"
                className="side-panel-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar panel"
              >
                <ChevronRight aria-hidden />
              </button>

              <div className="side-panel-user">
                <span className="side-panel-avatar">{initial}</span>
                <span className="side-panel-user-copy">
                  <strong>{profile?.full_name || profile?.username || 'Usuario'}</strong>
                  <small><i />{roleLabel}</small>
                </span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {editMode ? (
                  <motion.div
                    key="editing"
                    className="side-panel-edit-actions"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    <button type="button" onClick={onCancelEdit}><X aria-hidden />Cancelar</button>
                    <button type="button" className="primary" onClick={onSaveEdit}><Check aria-hidden />Guardar</button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="order"
                    type="button"
                    className="side-panel-order"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onStartEdit}
                  >
                    <LayoutGrid aria-hidden /> Ordenar hub
                  </motion.button>
                )}
              </AnimatePresence>

              <div className="side-panel-account-actions">
                {isAdmin && (
                  <Link to="/admin" onClick={onAdminNav}>
                    <Settings2 aria-hidden /> Admin
                  </Link>
                )}
                <button type="button" onClick={onSignOut}>
                  <LogOut aria-hidden /> Salir
                </button>
              </div>
            </div>

            <div className="side-panel-divider" />

            <section className="side-panel-projects">
              <header>
                <span><FolderKanban aria-hidden /> Proyectos</span>
                <b>{loading ? '…' : projects.length}</b>
              </header>

              <div className="side-panel-project-list">
                {!loading && projects.length === 0 && !adding && (
                  <div className="side-panel-empty">
                    <p>Sin proyectos aún.</p>
                    {isAdmin && <button type="button" onClick={openAdding}>Añadir el primero</button>}
                  </div>
                )}

                {loading && (
                  <div className="side-panel-skeletons" aria-label="Cargando proyectos">
                    <i /><i /><i />
                  </div>
                )}

                {!loading && projects.length > 0 && (
                  <Reorder.Group axis="y" values={projects} onReorder={handleReorder}>
                    {projects.map((project) => {
                      const status = statusData(project.status)
                      return (
                        <Reorder.Item
                          key={project.id}
                          value={project}
                          dragListener={isAdmin}
                          onMouseEnter={() => setHovered(project.id)}
                          onMouseLeave={() => setHovered(null)}
                          className="side-panel-project"
                          whileDrag={isAdmin ? { scale: 1.025, zIndex: 20 } : undefined}
                        >
                          <div>
                            {isAdmin && <GripVertical className={hovered === project.id ? 'visible' : ''} aria-hidden />}
                            <strong>{project.name}</strong>
                            {isAdmin && hovered === project.id && (
                              <button type="button" onClick={() => handleDelete(project.id)} aria-label={`Eliminar ${project.name}`}>
                                <X aria-hidden />
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className="side-panel-status"
                            disabled={!isAdmin}
                            onClick={() => handleCycleStatus(project.id)}
                            style={{ '--project-status': status.color }}
                          >
                            <i /> {status.label}
                          </button>
                        </Reorder.Item>
                      )
                    })}
                  </Reorder.Group>
                )}

                <AnimatePresence>
                  {adding && isAdmin && (
                    <motion.div
                      className="side-panel-add-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input
                        ref={nameInputRef}
                        value={newName}
                        onChange={(event) => {
                          setNewName(event.target.value)
                          setSaveError('')
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleAdd()
                          if (event.key === 'Escape') setAdding(false)
                        }}
                        placeholder="Nombre del proyecto…"
                        aria-label="Nombre del proyecto"
                      />
                      <div className="side-panel-status-options">
                        {STATUS.map((status) => (
                          <button
                            type="button"
                            key={status.value}
                            className={newStatus === status.value ? 'selected' : ''}
                            onClick={() => setNewStatus(status.value)}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                      {saveError && <p>{saveError}</p>}
                      <div className="side-panel-form-actions">
                        <button type="button" className="primary" disabled={!newName.trim()} onClick={handleAdd}>
                          <Check aria-hidden /> Añadir
                        </button>
                        <button type="button" onClick={() => setAdding(false)} aria-label="Cancelar">
                          <X aria-hidden />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {isAdmin && !adding && (
              <footer className="side-panel-footer">
                <button type="button" onClick={openAdding}><Plus aria-hidden /> Nuevo proyecto</button>
              </footer>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
