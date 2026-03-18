import { NextResponse } from 'next/server'
import { isMockMode, isTestMode } from '@/lib/mock-mode'
import { getProviderDisplayName } from '@/lib/payment'

export const dynamic = 'force-dynamic'

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

  const providerName = getProviderDisplayName()

  // In mock mode, always return healthy with simulated data
  if (mode === 'mock') {
    return NextResponse.json({
      status: 'healthy',
      mode: 'mock',
      paymentProvider: 'abacatepay',
      timestamp: new Date().toISOString(),
      services: [
        { service: 'database', status: 'up', latency: 10 },
        { service: 'apifull', status: 'up', latency: 50, message: 'Mockado', balance: { current: 150, unit: 'BRL', low: false } },
        { service: 'serper', status: 'up', latency: 30, message: 'Mockado', balance: { current: 2500, unit: 'credits', low: false } },
        { service: 'openai', status: 'up', latency: 40, message: 'Mockado' },
        { service: 'inngest', status: 'up', latency: 5, message: 'Mockado' },
        { service: 'resend', status: 'up', latency: 20, balance: { current: 'verificado', unit: 'domínio', low: false } },
        { service: 'payment', status: 'up', latency: 30, message: `Bypass (${providerName})` },
      ],
    })
  }

  const checks: Promise<HealthStatus>[] = [
    // Database check
    checkService('database', async () => {
      const { prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
    }),

    // APIFull balance check — real format: { dados: { Saldo: 19.5 } }
    checkServiceWithBalance('apifull', async () => {
      const res = await fetch('https://api.apifull.com.br/api/get-balance', {
        headers: {
          'Authorization': `Bearer ${process.env.APIFULL_API_KEY}`,
          'User-Agent': 'EOPIX/1.0',
        },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const balance = typeof data.dados?.Saldo === 'number' ? data.dados.Saldo : parseFloat(data.dados?.Saldo || '0')
      return { current: balance, unit: 'BRL', low: balance < 30 }
    }),

    // Serper credits check — real format: { balance: 2468 }
    checkServiceWithBalance('serper', async () => {
      const res = await fetch('https://google.serper.dev/account', {
        headers: { 'X-API-KEY': process.env.SERPER_API_KEY! },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const credits = data.balance ?? 0
      return { current: credits, unit: 'credits', low: credits < 500 }
    }),

    // OpenAI connectivity check (no billing access with regular key)
    checkService('openai', async () => {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    }),

    // Inngest check — verify env vars are configured
    checkService('inngest', async () => {
      if (!process.env.INNGEST_EVENT_KEY) throw new Error('INNGEST_EVENT_KEY not set')
      if (!process.env.INNGEST_SIGNING_KEY) throw new Error('INNGEST_SIGNING_KEY not set')
    }),

    // Resend check — domain verification + usage count (daily/monthly vs free plan limits)
    checkServiceWithBalance('resend', async () => {
      if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')

      const DAILY_LIMIT = 100
      const MONTHLY_LIMIT = 3000
      const WARN_PCT = 0.8

      // Domain check + usage count run in parallel
      const [domainsRes] = await Promise.all([
        fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          cache: 'no-store',
        }),
      ])

      if (!domainsRes.ok) throw new Error(`HTTP ${domainsRes.status}`)
      const domainsData = await domainsRes.json() as { data?: { name: string; status: string }[] }
      const domain = domainsData.data?.find((d) => d.name === 'somoseopix.com.br')
      if (!domain) throw new Error('Domínio somoseopix.com.br não encontrado')
      if (domain.status !== 'verified') throw new Error(`Domínio ${domain.status}`)

      // Count emails sent today and this month via pagination (stop when past month start)
      const now = new Date()
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      const todayStr = now.toISOString().slice(0, 10) // 'YYYY-MM-DD'

      let dailyCount = 0
      let monthlyCount = 0
      let cursor: string | undefined
      let done = false

      for (let page = 0; page < 10 && !done; page++) {
        const url = new URL('https://api.resend.com/emails')
        url.searchParams.set('limit', '100')
        if (cursor) url.searchParams.set('after', cursor)

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          cache: 'no-store',
        })
        if (!res.ok) break

        const data = await res.json() as {
          data?: { id: string; created_at: string }[]
          has_more?: boolean
        }
        const emails = data.data ?? []

        for (const email of emails) {
          const sentAt = new Date(email.created_at)
          if (sentAt < monthStart) { done = true; break }
          monthlyCount++
          if (email.created_at.slice(0, 10) === todayStr) dailyCount++
        }

        if (!data.has_more || emails.length === 0) done = true
        else cursor = emails[emails.length - 1].id
      }

      if (dailyCount >= DAILY_LIMIT) {
        throw new Error(`Limite diário atingido (${dailyCount}/${DAILY_LIMIT})`)
      }

      const low = dailyCount / DAILY_LIMIT >= WARN_PCT || monthlyCount / MONTHLY_LIMIT >= WARN_PCT
      return {
        current: `${dailyCount}/${DAILY_LIMIT} hoje · ${monthlyCount}/${MONTHLY_LIMIT} mês`,
        unit: '',
        low,
      }
    }),
  ]

  // Payment provider check only in live mode (not test mode which bypasses payment)
  if (mode === 'live') {
    checks.push(
      checkService('payment', async () => {
        const res = await fetch('https://api.abacatepay.com/v2/products/list', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY || ''}`,
          },
          cache: 'no-store',
        })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
      })
    )
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
    paymentProvider: 'abacatepay',
    timestamp: new Date().toISOString(),
    services: results,
  })
}
