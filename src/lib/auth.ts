import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is required')
  return secret
}
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
  // Convert raw bytes directly to base64url without TextEncoder re-encoding
  // (base64urlEncode uses TextEncoder which corrupts bytes > 127)
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  // Decode the base64url signature back to bytes for constant-time verify
  let base64 = signature.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  const binary = atob(base64)
  const sigBytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    sigBytes[i] = binary.charCodeAt(i)
  }
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data))
}

/**
 * Creates a session token (JWT-like) and sets it as httpOnly cookie
 */
export async function createSession(email: string, options?: { durationHours?: number }): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const durationSeconds = options?.durationHours
    ? options.durationHours * 60 * 60
    : SESSION_DURATION_DAYS * 24 * 60 * 60
  const exp = now + durationSeconds

  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64urlEncode(JSON.stringify({ email, iat: now, exp }))
  const signature = await hmacSign(`${header}.${payload}`, getJwtSecret())

  const token = `${header}.${payload}.${signature}`

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: durationSeconds,
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

    const isValid = await hmacVerify(`${header}.${payload}`, signature, getJwtSecret())
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

  const isAdmin = await isAdminEmail(session.email)
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  return session
}

/**
 * Gets session AND verifies user exists in DB. Clears cookie if user was deleted.
 * Use this in routes that create/modify data based on session identity.
 */
export async function getSessionWithUser(request?: NextRequest): Promise<(SessionPayload & { userId: string }) | null> {
  const session = await getSession(request)
  if (!session) return null

  try {
    const { prisma } = await import('./prisma')
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true },
    })
    if (!user) {
      // Ghost session — user was deleted but JWT is still valid
      console.warn(`[Auth] Ghost session detected for ${session.email} — clearing cookie`)
      await destroySession()
      return null
    }
    return { ...session, userId: user.id }
  } catch {
    return null
  }
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
 * Verifica tanto em ADMIN_EMAILS quanto na tabela AdminUser
 */
export async function isAdminEmail(email: string): Promise<boolean> {
  // 1. Verificar em ADMIN_EMAILS (mantém compatibilidade)
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true
  }

  // 2. Verificar na tabela AdminUser
  try {
    const { prisma } = await import('./prisma')
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase(), active: true }
    })
    return !!admin
  } catch {
    return false
  }
}

