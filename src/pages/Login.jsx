import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, LogIn, LoaderCircle, Plus, ArrowLeft, X } from 'lucide-react'
import gsap from 'gsap'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import AlasTransitionLoader from '../components/AlasTransitionLoader'

const DEMO_MODE = false
const EASE = [0.16, 1, 0.3, 1]

const T = {
  brand:       '#0B5F8D',
  brandDark:   '#08486A',
  border:      'rgba(226,232,240,0.9)',
  borderFocus: 'rgba(11,95,141,0.40)',
  text1:       '#0f172a',
  text2:       '#334155',
  text3:       '#64748b',
  surface:     '#ffffff',
  danger:      '#dc2626',
}

const pageVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.45, ease: EASE } },
  exit:    { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
}

const cardItemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE } }
}

const roleLabelMap = {
  admin:      'Administrador',
  supervisor: 'Supervisor',
  operador:   'Operador',
  invitado:   'Invitado',
}

export default function Login() {
  const { signIn, loginAsDemo, session, startEntry } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()


  const [rememberedUsers, setRememberedUsers] = useState(() => {
    try {
      const savedList = localStorage.getItem('alas.rememberedUsers')
      if (savedList) {
        return JSON.parse(savedList)
      }
      const savedSingle = localStorage.getItem('alas.lastUser')
      if (savedSingle) {
        const parsed = JSON.parse(savedSingle)
        if (parsed && parsed.username) {
          const list = [parsed]
          localStorage.setItem('alas.rememberedUsers', JSON.stringify(list))
          return list
        }
      }
      return []
    } catch (_) {
      return []
    }
  })

  const [selectedUser, setSelectedUser] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)
  const [hoveredUser, setHoveredUser] = useState(null)
  const cardRef = useRef(null)

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil,   setLockoutUntil]   = useState(null)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)

  useEffect(() => {
    if (!lockoutUntil) return
    const id = setInterval(() => {
      const rem = Math.ceil((lockoutUntil - Date.now()) / 1000)
      if (rem <= 0) {
        setLockoutUntil(null)
        setFailedAttempts(0)
        setLockoutSeconds(0)
      } else {
        setLockoutSeconds(rem)
      }
    }, 500)
    return () => clearInterval(id)
  }, [lockoutUntil])


  // Ya tiene sesión activa → redirigir a inicio
  if (session) return <Navigate to="/" replace />

  const to = location.state?.from?.pathname || '/'

  // Submit del formulario completo (nuevo usuario)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (lockoutUntil) return
    setError('')
    setBusy(true)

    const shake = () => {
      gsap.killTweensOf(cardRef.current)
      gsap.fromTo(cardRef.current, { x: -10 }, { x: 0, duration: 0.48, ease: 'elastic.out(1, 0.28)', clearProps: 'x' })
    }

    const registerFailure = () => {
      const next = failedAttempts + 1
      setFailedAttempts(next)
      if (next >= 5) {
        setLockoutUntil(Date.now() + 30000)
        setLockoutSeconds(30)
      }
    }

    const { data: emailData, error: rpcErr } = await supabase.rpc('get_email_by_username', { p_username: username.trim() })
    if (rpcErr || !emailData) {
      setBusy(false)
      registerFailure()
      setError('Usuario o contraseña incorrectos.')
      shake()
      return
    }
    const { error } = await signIn(emailData, password)
    setBusy(false)
    if (error) {
      registerFailure()
      setError('Usuario o contraseña incorrectos.')
      shake()
      return
    }

    setFailedAttempts(0)
    setLockoutUntil(null)
    startEntry()
    navigate(to, { replace: true })
  }

  // Submit del formulario con usuario seleccionado
  const handleSelectedUserSubmit = async (e) => {
    e.preventDefault()
    if (lockoutUntil) return
    setError('')
    setBusy(true)

    const shake = () => {
      gsap.killTweensOf(cardRef.current)
      gsap.fromTo(cardRef.current, { x: -10 }, { x: 0, duration: 0.48, ease: 'elastic.out(1, 0.28)', clearProps: 'x' })
    }

    const registerFailure = () => {
      const next = failedAttempts + 1
      setFailedAttempts(next)
      if (next >= 5) {
        setLockoutUntil(Date.now() + 30000)
        setLockoutSeconds(30)
      }
    }

    const { data: emailData, error: rpcErr } = await supabase.rpc('get_email_by_username', { p_username: selectedUser.username })
    if (rpcErr || !emailData) {
      setBusy(false)
      registerFailure()
      setError('Usuario o contraseña incorrectos.')
      shake()
      return
    }
    const { error } = await signIn(emailData, password)
    setBusy(false)
    if (error) {
      registerFailure()
      setError('Usuario o contraseña incorrectos.')
      shake()
      return
    }

    setFailedAttempts(0)
    setLockoutUntil(null)
    startEntry()
    navigate(to, { replace: true })
  }

  // Quitar usuario de la lista recordada
  const handleRemoveUser = (e, userToRemove) => {
    e.stopPropagation()
    const updated = rememberedUsers.filter(u => u.username !== userToRemove)
    localStorage.setItem('alas.rememberedUsers', JSON.stringify(updated))
    setRememberedUsers(updated)
    if (selectedUser?.username === userToRemove) {
      setSelectedUser(null)
    }
  }

  const handleDemo = () => {
    if (loginAsDemo) {
      loginAsDemo()
      navigate(to, { replace: true })
    }
  }



  // Decidir qué vista del login mostrar
  const displayedUsers = rememberedUsers
  const showSelector = displayedUsers.length > 0 && !selectedUser && !isAddingNew
  const isLocked = busy || !!lockoutUntil

  return (
    <div
      className="h-full grid place-items-center px-4 py-8"
      style={{
        background: 'linear-gradient(145deg, #edf1f7 0%, #e6ecf5 55%, #edf2f8 100%)',
        fontFamily: '"Inter", system-ui, sans-serif',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}
    >
      <motion.div
        layout
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 24,
          padding: showSelector ? '44px 40px' : '40px 36px',
          width: '100%',
          maxWidth: showSelector ? 580 : 360,
          boxShadow: '0 16px 40px rgba(15,23,42,0.06), 0 1px 4px rgba(15,23,42,0.02)',
          transition: 'max-width 300ms var(--alas-ease)',
        }}
      >
        <div ref={cardRef}>

        {/* ─── CASO A: Selector de usuarios en cuadrícula (Pro Selector Grid) ─── */}
        {showSelector ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img
                src="/logo.png"
                alt="ALAS"
                style={{
                  height: 28, width: 'auto', margin: '0 auto 12px', display: 'block',
                  filter: 'brightness(0) saturate(100%) invert(24%) sepia(61%) saturate(1200%) hue-rotate(183deg) brightness(85%)',
                }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <h1 style={{
                fontFamily: '"Sora", system-ui, sans-serif',
                fontWeight: 700, fontSize: 18, color: T.text1, margin: 0,
                letterSpacing: '-0.02em'
              }}>
                Selecciona tu cuenta
              </h1>
              <p style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>
                Gestión de logística
              </p>
            </div>

            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '24px',
                marginBottom: 10,
                marginTop: 28,
              }}
            >
              {displayedUsers.map(u => (
                <motion.button
                  key={u.username}
                  variants={cardItemVariants}
                  onClick={() => {
                    setSelectedUser(u)
                    setPassword('')
                    setError('')
                  }}
                  whileHover={{ scale: 1.05 }}
                  onMouseEnter={() => setHoveredUser(u.username)}
                  onMouseLeave={() => setHoveredUser(null)}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    outline: 'none',
                    textAlign: 'center',
                    width: 104,
                  }}
                >
                  {/* Botón para olvidar usuario */}
                  <button
                    onClick={(e) => handleRemoveUser(e, u.username)}
                    title="Olvidar cuenta"
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      background: '#ffffff', border: '1px solid rgba(239, 68, 68, 0.15)',
                      padding: 4, cursor: 'pointer', color: '#94a3b8',
                      display: 'grid', placeItems: 'center', borderRadius: '50%',
                      boxShadow: '0 2px 6px rgba(15,23,42,0.05)',
                      transition: 'color 120ms ease, background 120ms ease, transform 120ms ease',
                      zIndex: 10,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fff1f1'; e.currentTarget.style.transform = 'scale(1.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'none' }}
                  >
                    <X style={{ width: 10, height: 10 }} />
                  </button>

                  <div style={{
                    width: 80, height: 80, borderRadius: 18,
                    background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                    display: 'grid', placeItems: 'center',
                    fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: 28,
                    color: '#ffffff',
                    boxShadow: hoveredUser === u.username
                      ? '0 12px 28px rgba(11, 95, 141, 0.22), 0 0 0 3px #0B5F8D'
                      : '0 6px 16px rgba(11, 95, 141, 0.08), 0 0 0 3px transparent',
                    transition: 'box-shadow 200ms ease, transform 200ms ease',
                    transform: hoveredUser === u.username ? 'translateY(-2px)' : 'none',
                  }}>
                    {(u.full_name || u.username || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div style={{ width: '100%', marginTop: 2 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 700,
                      color: hoveredUser === u.username ? T.brand : T.text1,
                      margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      lineHeight: 1.25,
                      transition: 'color 180ms ease'
                    }}>
                      {u.full_name}
                    </p>
                    <p style={{
                      fontSize: 9, fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                      color: T.text3, margin: '3px 0 0'
                    }}>
                      {roleLabelMap[u.role] || u.role}
                    </p>
                  </div>
                </motion.button>
              ))}

              {/* Botón "+ Agregar cuenta" */}
              <motion.button
                variants={cardItemVariants}
                onClick={() => {
                  setIsAddingNew(true)
                  setUsername('')
                  setPassword('')
                  setError('')
                }}
                whileHover={{ scale: 1.05 }}
                onMouseEnter={() => setHoveredUser('__add__')}
                onMouseLeave={() => setHoveredUser(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  outline: 'none',
                  textAlign: 'center',
                  width: 104,
                }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: 18,
                  border: hoveredUser === '__add__'
                    ? '2px dashed #0B5F8D'
                    : '2px dashed rgba(11, 95, 141, 0.25)',
                  background: hoveredUser === '__add__'
                    ? 'rgba(11, 95, 141, 0.04)'
                    : 'transparent',
                  display: 'grid', placeItems: 'center',
                  color: hoveredUser === '__add__' ? T.brand : 'rgba(11, 95, 141, 0.4)',
                  transition: 'border-color 200ms ease, background-color 200ms ease, color 200ms ease, transform 200ms ease',
                  transform: hoveredUser === '__add__' ? 'translateY(-2px)' : 'none',
                  boxSizing: 'border-box'
                }}>
                  <Plus style={{ width: 22, height: 22 }} />
                </div>
                <div style={{ width: '100%', marginTop: 2 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: hoveredUser === '__add__' ? T.brand : T.text3,
                    transition: 'color 180ms ease'
                  }}>
                    Agregar cuenta
                  </span>
                  <p style={{
                    fontSize: 9, fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: 'transparent', margin: '3px 0 0'
                  }}>
                    -
                  </p>
                </div>
              </motion.button>
            </motion.div>
          </div>
        ) : selectedUser ? (
          /* ─── CASO B: Usuario seleccionado, pide contraseña únicamente ─── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* Cabecera con botón de retroceso */}
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', position: 'relative' }}>
              <button
                onClick={() => setSelectedUser(null)}
                title="Volver al selector"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: T.text3, display: 'grid', placeItems: 'center',
                  padding: 6, borderRadius: 8, transition: 'background 120ms ease, color 120ms ease',
                  position: 'absolute', left: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; e.currentTarget.style.color = T.text1 }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.text3 }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} />
              </button>
              <img
                src="/logo.png"
                alt="ALAS"
                style={{
                  height: 24, width: 'auto', margin: '0 auto', display: 'block',
                  filter: 'brightness(0) saturate(100%) invert(24%) sepia(61%) saturate(1200%) hue-rotate(183deg) brightness(85%)',
                }}
              />
            </div>

            {/* Ficha de perfil */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                display: 'grid', placeItems: 'center',
                fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: 18,
                color: '#ffffff', boxShadow: '0 6px 16px rgba(11,95,141,0.2)'
              }}>
                {(selectedUser.full_name || selectedUser.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{
                  fontFamily: '"Sora", system-ui, sans-serif',
                  fontWeight: 700, fontSize: 15, color: T.text1, margin: 0,
                  letterSpacing: '-0.02em'
                }}>
                  {selectedUser.full_name}
                </h2>
                <p style={{
                  fontSize: 10.5, fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: T.text3, margin: '3px 0 0'
                }}>
                  {roleLabelMap[selectedUser.role] || selectedUser.role}
                </p>
              </div>
            </div>

            {/* Formulario Contraseña */}
            <form onSubmit={handleSelectedUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
              <LoginField
                icon={Lock}
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={setPassword}
              />

              {lockoutUntil ? (
                <p style={{ fontSize: 12.5, color: T.danger, margin: 0, textAlign: 'center' }}>
                  Demasiados intentos. Esperá <strong>{lockoutSeconds}s</strong> para continuar.
                </p>
              ) : error ? (
                <p style={{ fontSize: 12.5, color: T.danger, margin: 0, textAlign: 'center' }}>
                  {error}
                </p>
              ) : null}

              <motion.button
                type="submit"
                disabled={isLocked}
                whileHover={isLocked ? {} : { scale: 1.02, y: -1 }}
                whileTap={isLocked ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 0', borderRadius: 11, border: 'none', width: '100%',
                  background: isLocked ? 'rgba(11,95,141,0.5)' : `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                  color: '#fff', fontSize: 13.5, fontWeight: 600,
                  fontFamily: '"Inter", system-ui, sans-serif',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  letterSpacing: '-0.01em',
                  boxShadow: isLocked ? 'none' : '0 3px 12px rgba(11,95,141,0.28)',
                }}
              >
                {busy
                  ? <><LoaderCircle style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Accediendo…</>
                  : <><LogIn style={{ width: 14, height: 14 }} /> Acceder</>
                }
              </motion.button>
            </form>
          </div>
        ) : (
          /* ─── CASO C: Login completo estándar (Nombre de usuario + Contraseña) ─── */
          <>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            {displayedUsers.length > 0 && (
              <button
                onClick={() => {
                  setIsAddingNew(false)
                  setError('')
                }}
                title="Volver"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: T.text3, display: 'grid', placeItems: 'center',
                  padding: 6, borderRadius: 8, transition: 'background 120ms ease, color 120ms ease',
                  position: 'absolute', left: 24, top: 24
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; e.currentTarget.style.color = T.text1 }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.text3 }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} />
              </button>
            )}
            <img
              src="/logo.png"
              alt="ALAS"
              style={{
                height: 30, width: 'auto', margin: '0 auto 12px', display: 'block',
                filter: 'brightness(0) saturate(100%) invert(24%) sepia(61%) saturate(1200%) hue-rotate(183deg) brightness(85%)',
              }}
              onError={e => { e.target.style.display = 'none' }}
            />
            <h1 style={{
              fontFamily: '"Sora", system-ui, sans-serif',
              fontWeight: 700, fontSize: 18,
              color: T.text1, letterSpacing: '-0.03em',
              margin: '0 0 5px',
            }}>
              Iniciar sesión
            </h1>
            <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>
              Gestión de logística
            </p>
          </div>

          {DEMO_MODE ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: '#eff6ff', border: '1px solid rgba(11,95,141,0.15)',
                fontSize: 12.5, color: T.brand, lineHeight: 1.5,
              }}>
                <strong>Modo demo activo.</strong> No se requiere contraseña.
              </div>
              <motion.button
                onClick={handleDemo}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 0', borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  fontFamily: '"Inter", system-ui, sans-serif',
                  cursor: 'pointer', letterSpacing: '-0.01em',
                  boxShadow: '0 3px 12px rgba(11,95,141,0.28)',
                }}
              >
                <LogIn style={{ width: 15, height: 15 }} />
                Entrar al demo
              </motion.button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <LoginField
                icon={User}
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={setUsername}
              />

              <LoginField
                icon={Lock}
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={setPassword}
              />

              {lockoutUntil ? (
                <p style={{ fontSize: 12.5, color: T.danger, margin: 0, textAlign: 'center' }}>
                  Demasiados intentos. Esperá <strong>{lockoutSeconds}s</strong> para continuar.
                </p>
              ) : error ? (
                <p style={{ fontSize: 12.5, color: T.danger, margin: 0, textAlign: 'center' }}>
                  {error}
                </p>
              ) : null}

              <motion.button
                type="submit"
                disabled={isLocked}
                whileHover={isLocked ? {} : { scale: 1.02, y: -1 }}
                whileTap={isLocked ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 0', borderRadius: 11, border: 'none', width: '100%',
                  background: isLocked ? 'rgba(11,95,141,0.5)' : `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                  color: '#fff', fontSize: 13.5, fontWeight: 600,
                  fontFamily: '"Inter", system-ui, sans-serif',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  boxShadow: isLocked ? 'none' : '0 3px 12px rgba(11,95,141,0.28)',
                }}
              >
                {busy
                  ? <><LoaderCircle style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Accediendo…</>
                  : <><LogIn style={{ width: 14, height: 14 }} /> Iniciar sesión</>
                }
              </motion.button>
            </form>
          )}
          </>
        )}

        </div>
      </motion.div>
    </div>
  )
}

function LoginField({ icon: Icon, type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Icon style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        width: 15, height: 15,
        color: focused ? T.brand : '#94a3b8',
        transition: 'color 150ms ease',
        pointerEvents: 'none',
      }} />
      <input
        type={type}
        required
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          borderRadius: 11, padding: '11px 12px 11px 36px',
          border: `1px solid ${focused ? T.borderFocus : T.border}`,
          background: T.surface, fontSize: 13.5, color: T.text1,
          outline: 'none', fontFamily: '"Inter", system-ui, sans-serif',
          boxShadow: focused ? '0 0 0 3px rgba(11,95,141,0.08)' : 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
      />
    </div>
  )
}
