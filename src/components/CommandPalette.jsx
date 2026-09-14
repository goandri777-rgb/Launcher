import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CornerDownLeft, Search, X } from 'lucide-react'
import { getModuleIcon } from '../data/icons'

const EASE = [0.16, 1, 0.3, 1]

export default function CommandPalette({ open, onClose, onRequestOpen, modules, onOpen }) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const reduceMotion = useReducedMotion()

  const availableModules = useMemo(() => (
    modules
      .filter((module) => module.is_active !== false && !module.is_blocked)
      .filter((module) => module.name.toLowerCase().includes(search.trim().toLowerCase()))
  ), [modules, search])

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        open ? onClose() : onRequestOpen()
      }
      if (event.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [onClose, onRequestOpen, open])

  useEffect(() => {
    if (!open) return undefined
    setSearch('')
    setSelectedIndex(0)
    const timer = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const choose = (module) => {
    if (!module) return
    onClose()
    onOpen(module.key)
  }

  const handleInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((index) => (index + 1) % Math.max(availableModules.length, 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((index) => (index - 1 + availableModules.length) % Math.max(availableModules.length, 1))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      choose(availableModules[selectedIndex])
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="command-palette-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          role="presentation"
        >
          <button className="command-palette-backdrop" aria-label="Cerrar buscador" onClick={onClose} />
          <motion.section
            className="command-palette"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-label="Buscar módulo"
          >
            <div className="command-palette-search">
              <Search aria-hidden />
              <input
                ref={inputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Buscar un módulo…"
                aria-label="Buscar un módulo"
              />
              <button type="button" onClick={onClose} aria-label="Cerrar">
                <X aria-hidden />
              </button>
            </div>

            <div className="command-palette-results">
              {availableModules.length === 0 ? (
                <p className="command-palette-empty">No hay módulos disponibles.</p>
              ) : availableModules.map((module, index) => {
                const Icon = getModuleIcon(module.key)
                const selected = index === selectedIndex
                return (
                  <button
                    type="button"
                    key={module.key}
                    className={selected ? 'is-selected' : ''}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => choose(module)}
                  >
                    <span className="command-palette-icon"><Icon aria-hidden /></span>
                    <span>{module.name}</span>
                    {selected && <CornerDownLeft className="command-palette-enter" aria-hidden />}
                  </button>
                )
              })}
            </div>

            <footer>
              <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
              <span><kbd>Enter</kbd> abrir</span>
              <span><kbd>Esc</kbd> cerrar</span>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
