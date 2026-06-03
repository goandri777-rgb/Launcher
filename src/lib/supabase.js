import { createClient } from '@supabase/supabase-js'

// Solo variables públicas. La seguridad real reside en RLS (lado servidor).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Aviso temprano en desarrollo si faltan las variables de entorno.
  console.warn('[ALAS] Falta configurar VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,      // sesiones persistentes
    autoRefreshToken: true,    // renueva el token automáticamente
    detectSessionInUrl: true,
  },
})
