import { NextResponse } from 'next/server'
import { isMockMode } from '@/lib/mock-mode'

interface HealthStatus {
  service: string
  status: 'up' | 'down' | 'degraded'
  latency?: number
  message?: string
}

async function checkService(
  name: string,
  checkFn: () => Promise<void>,
  timeoutMs = 5000
): Promise<HealthStatus> {
  const start = Date.now()

  try {
    await Promise.race([
      checkFn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ])

    return {
      service: name,
      status: 'up',
      latency: Date.now() - start,
    }
  } catch (error) {
    return {
      service: name,
      status: 'down',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function GET() {
  // In mock mode, always return healthy
  if (isMockMode) {
    return NextResponse.json({
      status: 'healthy',
      mode: 'mock',
      timestamp: new Date().toISOString(),
      services: [
        { service: 'database', status: 'up', latency: 10 },
        { service: 'apifull', status: 'up', latency: 50 },
        { service: 'asaas', status: 'up', latency: 30 },
        { service: 'resend', status: 'up', latency: 20 },
        { service: 'openai', status: 'up', latency: 40 },
      ],
    })
  }

  const checks: Promise<HealthStatus>[] = [
    // Database check
    checkService('database', async () => {
      const { prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
    }),

    // Asaas check (ping endpoint)
    checkService('asaas', async () => {
      const env = process.env.ASAAS_ENV || 'sandbox'
      const baseUrl = env === 'production'
        ? 'https://api.asaas.com'
        : 'https://sandbox.asaas.com/api'

      const res = await fetch(`${baseUrl}/v3/myaccount`, {
        method: 'GET',
        headers: {
          access_token: process.env.ASAAS_API_KEY || '',
        },
      })

      if (!res.ok && res.status !== 401) {
        throw new Error(`HTTP ${res.status}`)
      }
    }),
  ]

  const results = await Promise.all(checks)

  const allUp = results.every((r) => r.status === 'up')
  const anyDown = results.some((r) => r.status === 'down')

  return NextResponse.json({
    status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
    mode: 'live',
    timestamp: new Date().toISOString(),
    services: results,
  })
}
