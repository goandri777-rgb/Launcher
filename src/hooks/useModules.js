import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { generateToken } from '../lib/sessionBridge'

// ── DEMO MODE ──────────────────────────────────────────────────────────────
// IMPORTANTE: Cambiar a false en producción para usar usuarios reales de Supabase.
const DEMO_MODE = false

// URLs de los módulos por entorno.
// Desarrollo: localhost. Producción: reemplazar con URLs de Vercel/dominio real.
// En producción con DEMO_MODE=false, la URL viene del RPC `open_module` de Supabase.
const IS_DEV = import.meta.env.DEV
const DEMO_MODULES = [
  { key: 'calendario', name: 'Calendario Tareas',     url: IS_DEV ? 'http://localhost:8080'  : import.meta.env.VITE_URL_CALENDARIO  || '', is_active: true, is_blocked: false },
  { key: 'acuses',     name: 'Acuses de Recibo',      url: IS_DEV ? ''                       : import.meta.env.VITE_URL_ACUSES       || '', is_active: true, is_blocked: false },
  { key: 'borrados',   name: 'Items Borrados',        url: IS_DEV ? ''                       : import.meta.env.VITE_URL_BORRADOS     || '', is_active: true, is_blocked: false },
  { key: 'pedidos',    name: 'Pedidos Caja Venta',    url: IS_DEV ? 'http://localhost:3000'  : import.meta.env.VITE_URL_PEDIDOS      || '', is_active: true, is_blocked: false },
  { key: 'recepcion',  name: 'Recepción Mercaderías', url: IS_DEV ? ''                       : import.meta.env.VITE_URL_RECEPCION    || '', is_active: true, is_blocked: false },
  { key: 'inventario', name: 'Inventario',            url: IS_DEV ? ''                       : import.meta.env.VITE_URL_INVENTARIO   || '', is_active: true, is_blocked: false },
]
// ──────────────────────────────────────────────────────────────────────────

// Obtiene SOLO los módulos que el usuario puede abrir.
// La lógica vive en una función SQL (SECURITY DEFINER) que reverifica permisos
// en el servidor: el cliente nunca recibe URLs de módulos no autorizados.
export function useModules() {
  const { profile, session } = useAuth()

  const [modules, setModules] = useState(DEMO_MODE ? DEMO_MODULES : [])
  const [loading, setLoading] = useState(!DEMO_MODE)

  const fetchModules = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_allowed_modules')
    if (error) {
      console.error('[ALAS] Error cargando módulos:', error.message)
      setModules([])
    } else {
      setModules(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (!DEMO_MODE) fetchModules() }, [fetchModules])

  // Abre un módulo con token SSO firmado adjunto en la URL.
  // En modo producción: reverifica el permiso en servidor antes de abrir.
  // En modo demo: usa la URL configurada en DEMO_MODULES.
  const openModule = useCallback(async (moduleKey) => {
    // ── Bloqueo de seguridad: sin sesión no se genera ningún token ──────
    if (!session) {
      console.warn('[ALAS SSO] openModule bloqueado: sin sesión activa.')
      return { ok: false, reason: 'Sin sesión activa' }
    }

    // ── Obtener URL de destino ──────────────────────────────────────────
    let destUrl

    if (DEMO_MODE) {
      const mod = modules.find(m => m.key === moduleKey)
      if (!mod) return { ok: false, reason: 'Módulo no encontrado' }
      if (!mod.url) {
        console.info(`[ALAS SSO] El módulo "${moduleKey}" no tiene URL configurada aún.`)
        return { ok: false, reason: 'URL del módulo no configurada' }
      }
      destUrl = mod.url
    } else {
      // Producción: el RPC verifica permisos en servidor y devuelve la URL
      const { data, error } = await supabase.rpc('open_module', { p_module_key: moduleKey })
      if (error || !data?.url) {
        return { ok: false, reason: error?.message || 'No autorizado' }
      }
      destUrl = data.url
    }

    // ── Generar token SSO firmado ────────────────────────────────────────
    let tokenStr
    try {
      tokenStr = await generateToken({
        userId:      profile?.id        || 'demo-user',
        name:        profile?.full_name || 'Usuario Demo',
        email:       session?.user?.email || 'demo@alas.com',
        role:        profile?.role      || 'operador',
        // Solo los módulos activos y no bloqueados que el usuario puede ver
        permissions: modules
          .filter(m => m.is_active && !m.is_blocked)
          .map(m => m.key),
      })
    } catch (e) {
      console.error('[ALAS SSO] Error generando token:', e.message)
      return { ok: false, reason: 'Error generando sesión' }
    }

    // ── Construir URL final y navegar en la misma pestaña ───────────────
    const separator = destUrl.includes('?') ? '&' : '?'
    const finalUrl  = `${destUrl}${separator}alas_token=${encodeURIComponent(tokenStr)}`

    console.info(`[ALAS SSO] Navegando a ${moduleKey} con token firmado.`)
    // Esperar 360ms para que el pulso visual de GSAP sea visible antes de salir
    await new Promise(r => setTimeout(r, 360))
    window.location.href = finalUrl
    return { ok: true }
  }, [modules, profile, session])

  return { modules, loading, openModule, refresh: fetchModules }
}
