import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

// ── DEMO MODE ──────────────────────────────────────────────────────────────
// PRODUCCIÓN: Cambiar a false y configurar VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY en .env
// Con DEMO_MODE=true: cualquiera puede ingresar sin credenciales — solo para desarrollo local.
const DEMO_MODE = true
const DEMO_SESSION = { user: { id: 'demo-user', email: 'demo@alas.com' } }
const DEMO_PROFILE = { id: 'demo-user', full_name: 'Usuario Demo', role: 'admin', is_active: true, is_blocked: false }
// ──────────────────────────────────────────────────────────────────────────

// Contexto global de sesión + perfil (rol, estado activo/bloqueado).
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(DEMO_MODE ? DEMO_SESSION : null)
  const [profile, setProfile] = useState(DEMO_MODE ? DEMO_PROFILE : null)
  const [loading, setLoading] = useState(!DEMO_MODE)

  // Carga el perfil del usuario desde la tabla `profiles` (protegida por RLS).
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_active, is_blocked, last_login')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('[ALAS] Error cargando perfil:', error.message)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }, [])

  useEffect(() => {
    if (DEMO_MODE) return

    // Sesión inicial.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      loadProfile(session?.user?.id).finally(() => setLoading(false))
    })

    // Suscripción a cambios de auth (login, logout, refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      loadProfile(session?.user?.id)
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }
    // Registra el último acceso vía RPC (reverificado en servidor).
    await supabase.rpc('register_login').catch(() => {})
    return { error: null }
  }

  const signOut = async () => {
    if (!DEMO_MODE) await supabase.auth.signOut()
    // Limpiar estado — en DEMO_MODE también, para que el logout tenga efecto visible
    setSession(null)
    setProfile(null)
    // Limpiar sesión SSO local (no puede limpiar otros dominios — TTL 60 min lo cubre)
    try { localStorage.removeItem('alas.sso.session') } catch (_) {}
  }

  // En DEMO_MODE: restaura la sesión demo sin necesitar Supabase
  const loginAsDemo = () => {
    if (!DEMO_MODE) return
    setSession(DEMO_SESSION)
    setProfile(DEMO_PROFILE)
  }

  const value = { session, profile, loading, signIn, signOut, loginAsDemo, reloadProfile: () => loadProfile(session?.user?.id) }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
