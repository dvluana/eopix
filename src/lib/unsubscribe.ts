// Token HMAC-SHA256 determinístico para links de unsubscribe.
// Usa Web Crypto API (Edge Runtime compatible) — mesmo padrão de auth.ts.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is required')
  return secret
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmacVerify(data: string, token: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret)
  return expected === token
}

export async function generateUnsubscribeToken(email: string): Promise<string> {
  return hmacSign(email.toLowerCase(), getSecret())
}

export async function verifyUnsubscribeToken(email: string, token: string): Promise<boolean> {
  return hmacVerify(email.toLowerCase(), token, getSecret())
}

export async function buildUnsubscribeUrl(email: string): Promise<string> {
  const token = await generateUnsubscribeToken(email)
  const params = new URLSearchParams({ token, email })
  return `${APP_URL}/api/unsubscribe?${params.toString()}`
}
