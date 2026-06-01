// sessionBridge.js — SSO token generator para el ecosistema ALAS
//
// Formato del token: base64url(payload).base64url(firma_hmac_sha256)
//
// La firma usa HMAC-SHA-256 con un secreto compartido (VITE_SSO_SECRET).
// Sin el secreto correcto, el token no puede ser forjado ni modificado.
// El payload contiene userId, name, email, role, permissions, iat y exp.
//
// Subsistemas: leen el token del URL → validan firma → limpian el URL.

const SECRET = import.meta.env.VITE_SSO_SECRET || 'REEMPLAZAR-EN-PRODUCCION'
const TTL_MS  = 60 * 60 * 1000 // 60 minutos — reducido para minimizar ventana de sesiones huérfanas

// ─── Utilidades base64url (compatible con URL, sin +/= problemáticos) ────────
function toBase64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
function fromBase64url(str) {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '='))
}

// ─── Importa la clave HMAC desde el secreto compartido ───────────────────────
async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

// ─── generateToken ────────────────────────────────────────────────────────────
// Recibe el perfil del usuario y la lista de módulos a los que tiene acceso.
// Devuelve un string "payloadB64url.firmaB64url" listo para poner en la URL.
export async function generateToken({ userId, name, email, role, permissions }) {
  const payload = {
    userId,
    name,
    email,
    role,
    permissions, // array de keys de módulos: ['pedidos', 'calendario', ...]
    iat: Date.now(),
    exp: Date.now() + TTL_MS,
  }

  const payloadB64 = toBase64url(unescape(encodeURIComponent(JSON.stringify(payload))))

  const key = await importHmacKey(SECRET)
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64)
  )
  const sigB64 = toBase64url(String.fromCharCode(...new Uint8Array(sigBuffer)))

  return `${payloadB64}.${sigB64}`
}

// ─── verifyToken ──────────────────────────────────────────────────────────────
// Verifica firma y expiración. Devuelve el payload o null si el token es inválido.
// Los subsistemas usan esta función para validar el token recibido del launcher.
export async function verifyToken(token) {
  if (!token || typeof token !== 'string') return null

  const dot = token.lastIndexOf('.')
  if (dot < 1) return null

  const payloadB64 = token.slice(0, dot)
  const sigB64     = token.slice(dot + 1)

  try {
    const key      = await importHmacKey(SECRET)
    const sigBytes = Uint8Array.from(fromBase64url(sigB64), c => c.charCodeAt(0))

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(payloadB64)
    )
    if (!valid) {
      console.warn('[ALAS SSO] Token con firma inválida — posible manipulación.')
      return null
    }

    const payload = JSON.parse(decodeURIComponent(escape(fromBase64url(payloadB64))))

    if (Date.now() > payload.exp) {
      console.warn('[ALAS SSO] Token expirado.')
      return null
    }

    return payload
  } catch (e) {
    console.warn('[ALAS SSO] Error parseando token:', e.message)
    return null
  }
}

// ─── readTokenFromUrl ─────────────────────────────────────────────────────────
// Extrae el token del URL actual, lo valida y LIMPIA el parámetro del URL
// usando history.replaceState para que no quede visible en la barra del browser.
// Usarlo en los subsistemas al iniciar la app.
export async function readTokenFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const raw    = params.get('alas_token')
  if (!raw) return null

  // Limpiar de la URL inmediatamente, antes de validar
  params.delete('alas_token')
  const cleanUrl = [
    window.location.pathname,
    params.toString() ? '?' + params.toString() : '',
  ].join('')
  window.history.replaceState({}, '', cleanUrl)

  return verifyToken(decodeURIComponent(raw))
}
