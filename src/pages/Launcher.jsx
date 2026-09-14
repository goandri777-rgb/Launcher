import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import { useModules } from '../hooks/useModules'
import AlasTransitionLoader from '../components/AlasTransitionLoader'
import CircularLauncher from '../components/CircularLauncher'
import CommandPalette from '../components/CommandPalette'
import MobileHub from '../components/MobileHub'
import ProjectsSidebar from '../components/ProjectsSidebar'

const EASE = [0.16, 1, 0.3, 1]

const ROLE_LABEL = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  operador: 'Operador',
  registro: 'Registro',
  calendario: 'Calendario',
  acuses: 'Acuses',
  invitado: 'Invitado',
}

function useIsMobile(breakpoint = 820) {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(`(max-width:${breakpoint}px)`).matches
  ))

  useEffect(() => {
    const query = window.matchMedia(`(max-width:${breakpoint}px)`)
    const update = () => setIsMobile(query.matches)
    query.addEventListener ? query.addEventListener('change', update) : query.addListener(update)
    return () => {
      query.removeEventListener ? query.removeEventListener('change', update) : query.removeListener(update)
    }
  }, [breakpoint])

  return isMobile
}

const orderKey = (userId) => `alas.hub.order.${userId}`

function loadOrder(userId) {
  try {
    return JSON.parse(localStorage.getItem(orderKey(userId)) ?? 'null')
  } catch {
    return null
  }
}

function saveOrder(userId, keys) {
  try {
    localStorage.setItem(orderKey(userId), JSON.stringify(keys))
  } catch {
    // La navegación no depende del orden visual guardado.
  }
}

function groupByState(modules) {
  const active = modules.filter((module) => !module.is_blocked && module.is_active !== false)
  const blocked = modules.filter((module) => module.is_blocked)
  const inactive = modules.filter((module) => module.is_active === false)
  return [...active, ...blocked, ...inactive]
}

function applyOrder(modules, savedKeys) {
  if (!savedKeys?.length) return groupByState(modules)
  const moduleByKey = Object.fromEntries(modules.map((module) => [module.key, module]))
  const ordered = savedKeys.filter((key) => moduleByKey[key]).map((key) => moduleByKey[key])
  const remaining = groupByState(modules.filter((module) => !savedKeys.includes(module.key)))
  return [...ordered, ...remaining]
}

export default function Launcher() {
  const { profile, loading: authLoading, signOut, stopEntry } = useAuth()
  const { modules, loading: modulesLoading, openModule } = useModules()
  const isMobile = useIsMobile()

  const [isExiting, setIsExiting] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [hubEditMode, setHubEditMode] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [hubOrderVersion, setHubOrderVersion] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    if (modulesLoading || authLoading) return undefined
    const timer = setTimeout(stopEntry, 400)
    return () => clearTimeout(timer)
  }, [modulesLoading, authLoading, stopEntry])

  const orderedModules = useMemo(() => {
    if (!profile?.id || !modules.length) return modules
    return applyOrder(modules, loadOrder(profile.id))
  }, [modules, profile?.id, hubOrderVersion])

  const handleSaveHubOrder = () => {
    if (profile?.id && pendingOrder?.length) {
      saveOrder(profile.id, pendingOrder.map((module) => module.key))
      setHubOrderVersion((version) => version + 1)
    }
    setHubEditMode(false)
    setPendingOrder(null)
  }

  const handleCancelHubOrder = () => {
    setHubEditMode(false)
    setPendingOrder(null)
  }

  const handleOpenModule = useCallback(async (key) => {
    setCommandOpen(false)
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
    ? { opacity: 0, scale: 0.965, filter: 'blur(8px)' }
    : isLaunching
      ? { opacity: 0, scale: 0.985, filter: 'blur(5px)' }
      : { opacity: 1, scale: 1, filter: 'blur(0px)' }

  const roleLabel = ROLE_LABEL[profile?.role] || profile?.role || '—'

  return (
    <>
      <div className="launcher-background" aria-hidden>
        <div className="launcher-vignette" />
        <div className="alas-aurora alas-aurora-1" />
        <div className="alas-aurora alas-aurora-2" />
      </div>

      <motion.div
        className="h-full"
        style={{ position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, y: 10, scale: 0.985 }}
        animate={exitState}
        transition={{
          duration: isExiting || isLaunching ? 0.26 : 0.48,
          ease: isExiting || isLaunching ? [0.4, 0, 1, 1] : EASE,
        }}
        onAnimationComplete={() => {
          if (isExiting) signOut()
        }}
      >
        {isMobile ? (
          <MobileHub
            profile={profile}
            modules={orderedModules}
            onOpen={handleOpenModule}
            onSignOut={() => setIsExiting(true)}
            canAdmin={profile?.role === 'admin'}
            roleLabel={roleLabel}
            onAdminNav={stopEntry}
          />
        ) : (
          <div className="launcher-desktop-shell">
            <motion.header
              className="launcher-brand"
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
            >
              <img src="/alas_logo.png" alt="ALAS" />
            </motion.header>

            <main className="launcher-orbit-stage">
              {modulesLoading ? null : modules.length === 0 ? (
                <motion.div
                  className="launcher-empty-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <strong>Sin módulos asignados</strong>
                  <span>Pedí acceso al administrador.</span>
                </motion.div>
              ) : (
                <CircularLauncher
                  modules={orderedModules}
                  onOpen={handleOpenModule}
                  editMode={hubEditMode}
                  onOrderChange={setPendingOrder}
                />
              )}
            </main>

            <ProjectsSidebar
              open={sidebarOpen}
              setOpen={setSidebarOpen}
              roleLabel={roleLabel}
              editMode={hubEditMode}
              onStartEdit={() => setHubEditMode(true)}
              onSaveEdit={handleSaveHubOrder}
              onCancelEdit={handleCancelHubOrder}
              onSignOut={() => setIsExiting(true)}
              onAdminNav={stopEntry}
            />

            <CommandPalette
              open={commandOpen}
              onClose={() => setCommandOpen(false)}
              onRequestOpen={() => setCommandOpen(true)}
              modules={orderedModules}
              onOpen={handleOpenModule}
            />
          </div>
        )}
      </motion.div>

      <AlasTransitionLoader active={isLaunching} label="Abriendo módulo" />
    </>
  )
}
