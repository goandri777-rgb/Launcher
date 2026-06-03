import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'

// ── DEMO MODE ──────────────────────────────────────────────────────────────
// PRODUCCIÓN: Cambiar a false y configurar VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY en .env
// Con DEMO_MODE=true: cualquiera puede ingresar sin credenciales — solo para desarrollo local.
const DEMO_MODE = false
const DEMO_SESSION = { user: { id: 'demo-user', email: 'demo@alas.com' } }
const DEMO_PROFILE = { id: 'demo-user', full_name: 'Usuario Demo', role: 'admin', is_active: true, is_blocked: false }
// ──────────────────────────────────────────────────────────────────────────

// Contexto global de sesión + perfil (rol, estado activo/bloqueado).
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,      setSession]      = useState(DEMO_MODE ? DEMO_SESSION : null)
  const [profile,      setProfile]      = useState(DEMO_MODE ? DEMO_PROFILE : null)
  const [loading,      setLoading]      = useState(!DEMO_MODE)
  const [appBooting,   setAppBooting]   = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const transitionTimer = useRef(null)
  const entryStartTime = useRef(0)

  const startEntry = useCallback(() => {
    entryStartTime.current = Date.now()
    setTransitioning(true)
  }, [])

  const stopEntry  = useCallback(() => {
    const elapsed = Date.now() - entryStartTime.current
    const remaining = Math.max(0, 1400 - elapsed)

    clearTimeout(transitionTimer.current)
    transitionTimer.current = setTimeout(() => {
      setTransitioning(false)
    }, remaining)
  }, [])

  // Carga el perfil del usuario desde la tabla `profiles` (protegida por RLS).
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, role, is_active, is_blocked, last_login')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('[ALAS] Error cargando perfil:', error.message)
        setProfile(null)
      } else {
        setProfile(data)
        
        // Guardar el perfil en la lista de recordados de localStorage
        try {
          if (data && data.username) {
            const savedList = localStorage.getItem('alas.rememberedUsers')
            let list = savedList ? JSON.parse(savedList) : []
            const newUser = {
              username: data.username,
              full_name: data.full_name || data.username,
              role: data.role || 'operador',
            }
            const idx = list.findIndex(u => u.username === newUser.username)
            if (idx >= 0) {
              list[idx] = newUser
            } else {
              list.push(newUser)
            }
            localStorage.setItem('alas.rememberedUsers', JSON.stringify(list))
            // Expone usuario activo para ui-protection.js (banner de consola)
            localStorage.setItem('alas.current_user', JSON.stringify({
              name: data.full_name || data.username,
              role: data.role || 'operador',
            }))
          }
        } catch (e) {
          console.error('[ALAS] Error al guardar perfil en localStorage:', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (DEMO_MODE) {
      setAppBooting(false)
      return
    }

    // Garantizar un mínimo de 1400ms para la carga inicial / reload
    const minTimer = new Promise(resolve => setTimeout(resolve, 1400))

    // Carga de sesión inicial + perfil
    const sessionPromise = supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      return loadProfile(session?.user?.id)
    })

    Promise.all([sessionPromise, minTimer]).finally(() => {
      setAppBooting(false)
    })

    // Suscripción a cambios de auth (login, logout, refresh).
    // INITIAL_SESSION se omite: getSession() ya cargó el perfil en este mismo efecto.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      setSession(session)
      loadProfile(session?.user?.id)
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }
    // Setear sesión inmediatamente para que AuthGuard no flashee NoSession
    // antes de que onAuthStateChange procese el SIGNED_IN event en React.
    if (data?.session) setSession(data.session)
    try {
      await supabase.rpc('register_login')
    } catch (_) {}
    return { error: null }
  }

  const signOut = async () => {
    if (!DEMO_MODE) await supabase.auth.signOut()
    // Limpiar estado — en DEMO_MODE también, para que el logout tenga efecto visible
    setSession(null)
    setProfile(null)
    // Limpiar sesión SSO local (no puede limpiar otros dominios — TTL 60 min lo cubre)
    try {
      localStorage.removeItem('alas.sso.session')
      localStorage.removeItem('alas.current_user')
    } catch (_) {}
  }

  // En DEMO_MODE: restaura la sesión demo sin necesitar Supabase
  const loginAsDemo = () => {
    if (!DEMO_MODE) return
    setSession(DEMO_SESSION)
    setProfile(DEMO_PROFILE)
  }

  const value = { session, profile, loading, appBooting, transitioning, startEntry, stopEntry, signIn, signOut, loginAsDemo, reloadProfile: () => loadProfile(session?.user?.id) }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
