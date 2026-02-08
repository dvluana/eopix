import { NextRequest, NextResponse } from 'next/server'

// Rate limit store (in-memory for Edge Runtime)
// In production, consider using Upstash Redis for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'api-default': { maxRequests: 60, windowMs: 60 * 1000 }, // 60/min
  'api-auth': { maxRequests: 5, windowMs: 60 * 1000 }, // 5/min for auth endpoints
  'api-admin': { maxRequests: 100, windowMs: 60 * 1000 }, // 100/min for admin
  'api-search': { maxRequests: 10, windowMs: 60 * 1000 }, // 10/min for search
  'api-webhook': { maxRequests: 100, windowMs: 60 * 1000 }, // 100/min for webhooks
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

function getRateLimitKey(request: NextRequest): { key: string; config: RateLimitConfig } {
  const path = request.nextUrl.pathname
  const ip = getClientIp(request)

  if (path.startsWith('/api/auth/')) {
    return { key: `auth:${ip}`, config: RATE_LIMITS['api-auth'] }
  }

  if (path.startsWith('/api/admin/')) {
    return { key: `admin:${ip}`, config: RATE_LIMITS['api-admin'] }
  }

  if (path.startsWith('/api/search/')) {
    return { key: `search:${ip}`, config: RATE_LIMITS['api-search'] }
  }

  if (path.startsWith('/api/webhooks/')) {
    return { key: `webhook:${ip}`, config: RATE_LIMITS['api-webhook'] }
  }

  return { key: `default:${ip}`, config: RATE_LIMITS['api-default'] }
}

function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now - entry.windowStart > config.windowMs) {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    }
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + config.windowMs,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + config.windowMs,
  }
}

// Clean up old entries periodically (every 5 minutes)
let lastCleanup = Date.now()
function cleanupRateLimitStore() {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60 * 1000) return

  lastCleanup = now
  const maxAge = 10 * 60 * 1000 // 10 minutes

  const entries = Array.from(rateLimitStore.entries())
  for (const [key, entry] of entries) {
    if (now - entry.windowStart > maxAge) {
      rateLimitStore.delete(key)
    }
  }
}

async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get('eopix_session')?.value
  if (!cookie) return false

  try {
    // Decode JWT payload (middle part)
    const [, payloadB64] = cookie.split('.')
    if (!payloadB64) return false

    // Base64url decode
    let payload = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    while (payload.length % 4) payload += '='
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())

    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return false
    }

    // Check admin emails
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
    return adminEmails.includes(decoded.email?.toLowerCase())
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip middleware for static files and non-API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.includes('.') // Static files
  ) {
    return NextResponse.next()
  }

  // Rate limiting for API routes
  if (path.startsWith('/api/')) {
    cleanupRateLimitStore()

    const { key, config } = getRateLimitKey(request)
    const { allowed, remaining, resetAt } = checkRateLimit(key, config)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
            'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Admin routes require authentication
    if (path.startsWith('/api/admin/')) {
      const isAdmin = await verifyAdminAuth(request)
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Add rate limit headers to response
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString())

    return response
  }

  // Admin pages require authentication
  if (path.startsWith('/admin')) {
    const isAdmin = await verifyAdminAuth(request)
    if (!isAdmin) {
      // Redirect to home page for non-admins
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match admin pages
    '/admin/:path*',
  ],
}
