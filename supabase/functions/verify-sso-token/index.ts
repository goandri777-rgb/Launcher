// verify-sso-token — Edge Function que verifica tokens SSO firmados con HMAC-SHA-256.
// El secreto vive solo aquí (Supabase secrets), nunca en el cliente.
// POST { token: string } → { valid: true, payload: {...} } | { valid: false }

const SSO_SECRET = Deno.env.get('SSO_SECRET') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function fromBase64url(str: string): string {
  let padded = str.replace(/-/g, '+').replace(/_/g, '/')
  while (padded.length % 4) padded += '='
  return atob(padded)
}

async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  if (!token || !SSO_SECRET) return null

  const dot = token.lastIndexOf('.')
  if (dot < 1) return null

  const payloadB64 = token.slice(0, dot)
  const sigB64     = token.slice(dot + 1)

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SSO_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sigBytes = Uint8Array.from(fromBase64url(sigB64), (c) => c.charCodeAt(0))
    const valid    = await crypto.subtle.verify(
      'HMAC', key, sigBytes,
      new TextEncoder().encode(payloadB64)
    )
    if (!valid) return null

    const payload = JSON.parse(decodeURIComponent(escape(fromBase64url(payloadB64))))
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ valid: false })

  try {
    const { token } = await req.json()
    const payload   = await verifyToken(String(token ?? ''))
    return payload ? json({ valid: true, payload }) : json({ valid: false })
  } catch {
    return json({ valid: false })
  }
})
