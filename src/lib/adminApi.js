import { supabase } from '../lib/supabase'

// ── DEMO MODE ──────────────────────────────────────────────────────────────
const DEMO_MODE = false

const DEMO_USERS = [
  { id: 'u1', full_name: 'Admin ALAS',    email: 'admin@alas.com',    role: 'admin',      is_active: true,  is_blocked: false, last_login: new Date().toISOString() },
  { id: 'u2', full_name: 'Carlos Gómez',  email: 'cgomez@alas.com',   role: 'supervisor', is_active: true,  is_blocked: false, last_login: new Date(Date.now()-86400000).toISOString() },
  { id: 'u3', full_name: 'María López',   email: 'mlopez@alas.com',   role: 'operador',   is_active: true,  is_blocked: false, last_login: new Date(Date.now()-172800000).toISOString() },
  { id: 'u4', full_name: 'Jorge Pérez',   email: 'jperez@alas.com',   role: 'operador',   is_active: false, is_blocked: false, last_login: null },
  { id: 'u5', full_name: 'Laura Ramírez', email: 'lramirez@alas.com', role: 'invitado',   is_active: true,  is_blocked: true,  last_login: null },
]

const DEMO_MODULES = [
  { id: 'm1', key: 'calendario', name: 'Calendario Tareas',     url: 'https://app.alas.com/calendario', is_active: true,  sort_order: 1 },
  { id: 'm2', key: 'acuses',     name: 'Acuses de Recibo',      url: 'https://app.alas.com/acuses',     is_active: true,  sort_order: 2 },
  { id: 'm3', key: 'borrados',   name: 'Items Borrados',        url: 'https://app.alas.com/borrados',   is_active: true,  sort_order: 3 },
  { id: 'm4', key: 'pedidos',    name: 'Pedidos Caja Venta',    url: 'https://app.alas.com/pedidos',    is_active: true,  sort_order: 4 },
  { id: 'm5', key: 'recepcion',  name: 'Recepción Mercaderías', url: 'https://app.alas.com/recepcion',  is_active: true,  sort_order: 5 },
  { id: 'm6', key: 'inventario', name: 'Inventario',            url: '',                                is_active: false, sort_order: 6 },
]

const DEMO_PERMISSIONS = {
  u1: new Set(['m1','m2','m3','m4','m5','m6']),
  u2: new Set(['m1','m4','m5']),
  u3: new Set(['m4','m5']),
  u4: new Set([]),
  u5: new Set([]),
}

const DEMO_LOGS = [
  { id: 'l1', created_at: new Date().toISOString(),                   email: 'admin@alas.com',    action: 'login',        module_name: null },
  { id: 'l2', created_at: new Date(Date.now()-3600000).toISOString(), email: 'cgomez@alas.com',   action: 'open_module',  module_name: 'Pedidos Caja Venta' },
  { id: 'l3', created_at: new Date(Date.now()-7200000).toISOString(), email: 'mlopez@alas.com',   action: 'open_module',  module_name: 'Recepción Mercaderías' },
  { id: 'l4', created_at: new Date(Date.now()-86400000).toISOString(),email: 'cgomez@alas.com',   action: 'login',        module_name: null },
]
// ──────────────────────────────────────────────────────────────────────────

const ok  = (data)  => ({ data, error: null })
const err = (msg)   => ({ data: null, error: { message: msg } })

export const adminApi = {
  // Lista usuarios con su perfil y estado, enriquecido con username desde profiles.
  listUsers: async () => {
    if (DEMO_MODE) return Promise.resolve(ok(DEMO_USERS))
    const { data, error } = await supabase.rpc('admin_list_users')
    if (error || !data?.length) return { data: data ?? [], error }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', data.map(u => u.id))
    if (profiles?.length) {
      const byId = Object.fromEntries(profiles.map(p => [p.id, p.username]))
      data.forEach(u => { u.username = byId[u.id] ?? null })
    }
    return ok(data)
  },

  // Crea un usuario (vía función SECURITY DEFINER que usa el admin API interno).
  createUser: (email, password, fullName, role) => {
    if (DEMO_MODE) {
      DEMO_USERS.push({ id: `u${Date.now()}`, full_name: fullName, email, role, is_active: true, is_blocked: false, last_login: null })
      return Promise.resolve(ok(null))
    }
    return supabase.rpc('admin_create_user', { p_email: email, p_password: password, p_full_name: fullName, p_role: role })
  },

  // Activa/desactiva o bloquea/desbloquea.
  setActive: (userId, value) => {
    if (DEMO_MODE) {
      const u = DEMO_USERS.find(u => u.id === userId)
      if (u) u.is_active = value
      return Promise.resolve(ok(null))
    }
    return supabase.rpc('admin_set_active', { p_user_id: userId, p_value: value })
  },
  setBlocked: (userId, value) => {
    if (DEMO_MODE) {
      const u = DEMO_USERS.find(u => u.id === userId)
      if (u) u.is_blocked = value
      return Promise.resolve(ok(null))
    }
    return supabase.rpc('admin_set_blocked', { p_user_id: userId, p_value: value })
  },

  // Lista todos los módulos.
  listModules: () => DEMO_MODE
    ? Promise.resolve(ok(DEMO_MODULES))
    : supabase.from('modules').select('id,key,name,url,is_active,is_blocked,sort_order').order('sort_order'),

  // Permisos de un usuario.
  getUserPermissions: (userId) => {
    if (DEMO_MODE) {
      const set = DEMO_PERMISSIONS[userId] || new Set()
      return Promise.resolve(ok([...set].map(module_id => ({ module_id }))))
    }
    return supabase.rpc('admin_get_permissions', { p_user_id: userId })
  },

  // Asigna/quita un permiso de módulo a un usuario.
  togglePermission: (userId, moduleId, grant) => {
    if (DEMO_MODE) {
      if (!DEMO_PERMISSIONS[userId]) DEMO_PERMISSIONS[userId] = new Set()
      grant ? DEMO_PERMISSIONS[userId].add(moduleId) : DEMO_PERMISSIONS[userId].delete(moduleId)
      return Promise.resolve(ok(null))
    }
    return supabase.rpc('admin_toggle_permission', { p_user_id: userId, p_module_id: moduleId, p_grant: grant })
  },

  // Elimina un usuario y todo su historial de permisos (irreversible).
  deleteUser: (userId) => {
    if (DEMO_MODE) {
      const idx = DEMO_USERS.findIndex(u => u.id === userId)
      if (idx >= 0) DEMO_USERS.splice(idx, 1)
      return Promise.resolve(ok(null))
    }
    return supabase.rpc('admin_delete_user', { p_user_id: userId })
  },

  // Edita datos de un usuario (nombre, rol, contraseña).
  editUser: (userId, updates) => {
    if (DEMO_MODE) {
      const u = DEMO_USERS.find(u => u.id === userId)
      if (u) {
        if (updates.full_name !== undefined) u.full_name = updates.full_name
        if (updates.role     !== undefined) u.role      = updates.role
      }
      return Promise.resolve(ok(null))
    }
    return supabase.rpc('admin_edit_user', {
      p_user_id:  userId,
      p_full_name: updates.full_name ?? null,
      p_role:     updates.role      ?? null,
      p_password: updates.password  ?? null,
    })
  },

  // Actualiza campos de un módulo (url, name, is_active, sort_order).
  updateModule: async (id, updates) => {
    if (DEMO_MODE) {
      const m = DEMO_MODULES.find(m => m.id === id)
      if (m) Object.assign(m, updates)
      return ok(null)
    }
    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) return { data: null, error }
    return ok(data)
  },

  // Historial de actividad reciente.
  listLogs: (limit = 100) => DEMO_MODE
    ? Promise.resolve(ok(DEMO_LOGS.slice(0, limit)))
    : supabase.rpc('admin_list_logs', { p_limit: limit }),
}
