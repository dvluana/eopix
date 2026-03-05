import { NextResponse } from 'next/server'
import { isMockMode, isTestMode } from '@/lib/mock-mode'
import { getPaymentProvider, getProviderDisplayName } from '@/lib/payment'

interface BalanceInfo {
  current: number | string
  unit: string
  low?: boolean
}

interface HealthStatus {
  service: string
  status: 'up' | 'down' | 'degraded'
  latency?: number
  message?: string
  balance?: BalanceInfo
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

async function checkServiceWithBalance(
  name: string,
  checkFn: () => Promise<BalanceInfo>,
  timeoutMs = 5000
): Promise<HealthStatus> {
  const start = Date.now()

  try {
    const balance = await Promise.race([
      checkFn(),
      new Promise<BalanceInfo>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ])

    return {
      service: name,
      status: 'up',
      latency: Date.now() - start,
      balance,
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

function getMode(): 'mock' | 'test' | 'live' {
  if (isMockMode) return 'mock'
  if (isTestMode) return 'test'
  return 'live'
}

export async function GET() {
  const mode = getMode()

  const provider = getPaymentProvider()
  const providerName = getProviderDisplayName(provider)

  // In mock mode, always return healthy with simulated data
  if (mode === 'mock') {
    return NextResponse.json({
      status: 'healthy',
      mode: 'mock',
      paymentProvider: provider,
      timestamp: new Date().toISOString(),
      services: [
        { service: 'database', status: 'up', latency: 10 },
        { service: 'apifull', status: 'up', latency: 50, message: 'Mockado', balance: { current: 150, unit: 'BRL', low: false } },
        { service: 'serper', status: 'up', latency: 30, message: 'Mockado', balance: { current: 2500, unit: 'credits', low: false } },
        { service: 'openai', status: 'up', latency: 40, message: 'Mockado' },
        { service: 'payment', status: 'up', latency: 30, message: `Bypass (${providerName})` },
        { service: 'brevo', status: 'up', latency: 20, message: 'Console only' },
      ],
    })
  }

  const checks: Promise<HealthStatus>[] = [
    // Database check
    checkService('database', async () => {
      const { prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
    }),

    // APIFull balance check
    checkServiceWithBalance('apifull', async () => {
      const res = await fetch('https://api.apifull.com.br/api/get-balance', {
        headers: {
          'Authorization': `Bearer ${process.env.APIFULL_API_KEY}`,
          'User-Agent': 'EOPIX/1.0',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const balance = parseFloat(data.balance || '0')
      return { current: balance, unit: 'BRL', low: balance < 30 }
    }),

    // Serper credits check
    checkServiceWithBalance('serper', async () => {
      const res = await fetch('https://google.serper.dev/account', {
        headers: { 'X-API-KEY': process.env.SERPER_API_KEY! },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const credits = data.credits ?? 0
      return { current: credits, unit: 'credits', low: credits < 500 }
    }),

    // OpenAI connectivity check (no billing access with regular key)
    checkService('openai', async () => {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    }),

    // Brevo check (get account info)
    checkService('brevo', async () => {
      const res = await fetch('https://api.brevo.com/v3/account', {
        method: 'GET',
        headers: {
          'api-key': process.env.BREVO_API_KEY || '',
        },
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
    }),
  ]

  // Payment provider check only in live mode (not test mode which bypasses payment)
  if (mode === 'live') {
    if (provider === 'abacatepay') {
      checks.push(
        checkService('payment', async () => {
          const res = await fetch('https://api.abacatepay.com/v1/billing/list', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY || ''}`,
            },
          })
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
          }
        })
      )
    } else {
      checks.push(
        checkService('payment', async () => {
          const res = await fetch('https://api.stripe.com/v1/balance', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || ''}`,
            },
          })
          if (!res.ok && res.status !== 401) {
            throw new Error(`HTTP ${res.status}`)
          }
        })
      )
    }
  }

  const results = await Promise.all(checks)

  // In test mode, add info about bypassed services
  if (mode === 'test') {
    results.push({ service: 'payment', status: 'up', message: `Bypass - ${providerName} (TEST_MODE)` })
  }

  const allUp = results.every((r) => r.status === 'up')
  const anyDown = results.some((r) => r.status === 'down')

  return NextResponse.json({
    status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
    mode,
    paymentProvider: provider,
    timestamp: new Date().toISOString(),
    services: results,
  })
}
