import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ROLES = new Set(['admin', 'supervisor', 'operador', 'invitado'])

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeUsername(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 32)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { ok: false, reason: 'Metodo no permitido' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('ALAS_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { ok: false, reason: 'Falta configurar ALAS_SERVICE_ROLE_KEY en la Edge Function' })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: sessionData, error: sessionError } = await userClient.auth.getUser()
  if (sessionError || !sessionData.user) {
    return json(401, { ok: false, reason: 'Sesion invalida' })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: requester, error: requesterError } = await adminClient
    .from('profiles')
    .select('role,is_active,is_blocked')
    .eq('id', sessionData.user.id)
    .single()

  if (requesterError || requester?.role !== 'admin' || !requester?.is_active || requester?.is_blocked) {
    return json(403, { ok: false, reason: 'No autorizado' })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json(400, { ok: false, reason: 'Datos invalidos' })
  }

  const username = normalizeUsername(body.username)
  const requestedEmail = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const fullName = String(body.fullName ?? '').trim()
  const role = String(body.role ?? 'operador')

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return json(200, { ok: false, reason: 'Usuario invalido: usa 3 a 32 caracteres con letras, numeros, punto, guion o guion bajo' })
  }
  const email = requestedEmail || `${username}@launcher.alas.example`
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(200, { ok: false, reason: 'Correo electronico invalido' })
  }
  if (!password) {
    return json(200, { ok: false, reason: 'Contrasena requerida' })
  }
  if (!ROLES.has(role)) {
    return json(200, { ok: false, reason: 'Rol invalido' })
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      username,
    },
  })

  if (createError || !created.user?.id) {
    const createMessage = createError?.message ?? ''
    const lowerMessage = createMessage.toLowerCase()
    const message = lowerMessage.includes('already') || lowerMessage.includes('registered') || lowerMessage.includes('exists')
      ? 'Ese correo ya existe en Authentication'
      : createMessage || 'No se pudo crear el usuario'
    return json(200, { ok: false, reason: message })
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: created.user.id,
      username,
      full_name: fullName || null,
      role,
      is_active: true,
      is_blocked: false,
    }, { onConflict: 'id' })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id)
    const message = profileError.code === '23505'
      ? 'Ese username ya esta en uso'
      : profileError.message || 'No se pudo crear el perfil'
    return json(200, { ok: false, reason: message })
  }

  return json(200, { ok: true, id: created.user.id })
})
