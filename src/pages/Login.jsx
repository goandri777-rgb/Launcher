import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion, useAnimation } from 'framer-motion'
import { User, Lock, LogIn, LoaderCircle } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const DEMO_MODE = false
const EASE = [0.16, 1, 0.3, 1]

const pageVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.48, ease: EASE } },
  exit:    { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
}

const listVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.18 } },
}

const itemVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: EASE } },
}

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

export default function Login() {
  const { signIn, loginAsDemo, session, startEntry } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)
  const shakeControls = useAnimation()

  // Ya tiene sesión → volver al Launcher
  if (session) return <Navigate to="/" replace />

  const to = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    // Resolver username → email interno vía RPC
    const { data: email, error: rpcErr } = await supabase.rpc('get_email_by_username', { p_username: username.trim() })
    if (rpcErr || !email) {
      setBusy(false)
      setError('Usuario no encontrado.')
      return
    }
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) {
      setError('Contraseña incorrecta o cuenta no disponible.')
      shakeControls.start({
        x: [0, -9, 9, -6, 6, -3, 3, 0],
        transition: { duration: 0.38, ease: 'easeInOut' },
      })
      return
    }
    startEntry()
    navigate(to, { replace: true })
  }

  const handleDemo = () => {
    if (loginAsDemo) {
      loginAsDemo()
      navigate(to, { replace: true })
    }
  }

  return (
    <div
      className="h-full grid place-items-center px-4"
      style={{
        background: 'linear-gradient(145deg, #edf1f7 0%, #e6ecf5 55%, #edf2f8 100%)',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 24,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 4px 24px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)',
        }}
      >
        <motion.div animate={shakeControls}>

        {/* Logo + título */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img
            src="/logo.png"
            alt="ALAS"
            style={{
              height: 30, width: 'auto', margin: '0 auto 14px', display: 'block',
              filter: 'brightness(0) saturate(100%) invert(24%) sepia(61%) saturate(1200%) hue-rotate(183deg) brightness(85%)',
            }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <h1 style={{
            fontFamily: '"Sora", system-ui, sans-serif',
            fontWeight: 700, fontSize: 19,
            color: T.text1, letterSpacing: '-0.03em',
            margin: '0 0 5px',
          }}>
            Iniciar sesión
          </h1>
          <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>
            Portal logístico ALAS
          </p>
        </div>

        {/* Modo demo */}
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
          /* Formulario real — campos con stagger */
          <motion.form
            onSubmit={handleSubmit}
            variants={listVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <motion.div variants={itemVariants}>
              <LoginField
                icon={User}
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={setUsername}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <LoginField
                icon={Lock}
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={setPassword}
              />
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: 12.5, color: T.danger, margin: 0, textAlign: 'center' }}
              >
                {error}
              </motion.p>
            )}

            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={busy}
                whileHover={busy ? {} : { scale: 1.02, y: -1 }}
                whileTap={busy ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 0', borderRadius: 12, border: 'none', width: '100%',
                  background: busy ? 'rgba(11,95,141,0.5)' : `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  fontFamily: '"Inter", system-ui, sans-serif',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  letterSpacing: '-0.01em',
                  boxShadow: busy ? 'none' : '0 3px 12px rgba(11,95,141,0.28)',
                }}
              >
                {busy
                  ? <><LoaderCircle style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> Entrando…</>
                  : <><LogIn style={{ width: 15, height: 15 }} /> Iniciar sesión</>
                }
              </motion.button>
            </motion.div>
          </motion.form>
        )}

        </motion.div>{/* /shakeControls */}
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
