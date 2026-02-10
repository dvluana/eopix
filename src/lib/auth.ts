import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-insecure'
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
const SESSION_COOKIE = 'eopix_session'
const SESSION_DURATION_DAYS = 30

interface SessionPayload {
  email: string
  iat: number
  exp: number
}

// Simple base64url encoding/decoding using Web APIs (Edge Runtime compatible)
function base64urlEncode(str: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

// Simple HMAC-SHA256 using Web Crypto API
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
  let str = ''
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i])
  }
  return base64urlEncode(str)
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await hmacSign(data, secret)
  return signature === expectedSignature
}

/**
 * Creates a session token (JWT-like) and sets it as httpOnly cookie
 */
export async function createSession(email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + SESSION_DURATION_DAYS * 24 * 60 * 60

  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64urlEncode(JSON.stringify({ email, iat: now, exp }))
  const signature = await hmacSign(`${header}.${payload}`, JWT_SECRET)

  const token = `${header}.${payload}.${signature}`

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  })

  return token
}

/**
 * Gets session from cookie and validates JWT
 */
export async function getSession(request?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined

  if (request) {
    token = request.cookies.get(SESSION_COOKIE)?.value
  } else {
    const cookieStore = await cookies()
    token = cookieStore.get(SESSION_COOKIE)?.value
  }

  if (!token) return null

  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null

    const isValid = await hmacVerify(`${header}.${payload}`, signature, JWT_SECRET)
    if (!isValid) return null

    const data = JSON.parse(base64urlDecode(payload)) as SessionPayload

    // Check expiration
    if (data.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return data
  } catch {
    return null
  }
}

/**
 * Middleware helper: redirects to home if no session
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | SessionPayload> {
  const session = await getSession(request)

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return session
}

/**
 * Middleware helper: requires admin email
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | SessionPayload> {
  const session = await getSession(request)

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!ADMIN_EMAILS.includes(session.email.toLowerCase())) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  return session
}

/**
 * Clears the session cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/**
 * Check if an email is admin
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Generate a 6-digit magic code
 */
export function generateMagicCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
