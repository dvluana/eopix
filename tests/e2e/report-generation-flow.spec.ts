import { test, expect } from '@playwright/test'

interface HealthResponse {
  mode?: 'mock' | 'test' | 'live'
}

interface CreatePurchaseResponse {
  code: string
}

interface ProcessSearchResponse {
  success: boolean
  searchResultId: string
}

test.describe('Report Generation Flow (API)', () => {
  test('creates purchase, processes search, and fetches report', async ({ request }) => {
    const healthRes = await request.get('/api/health')
    expect(healthRes.status()).toBe(200)
    const health = await healthRes.json() as HealthResponse

    test.skip(
      health.mode === 'live',
      'This smoke covers bypass/dev processing only (mock/test mode).'
    )

    const createRes = await request.post('/api/purchases', {
      data: {
        term: '12345678909',
        email: 'flow-test@example.com',
        termsAccepted: true,
      },
    })
    expect(createRes.status()).toBe(200)
    const createData = await createRes.json() as CreatePurchaseResponse
    expect(createData.code).toBeTruthy()

    const processRes = await request.post(`/api/process-search/${createData.code}`)
    expect(processRes.status()).toBe(200)
    const processData = await processRes.json() as ProcessSearchResponse
    expect(processData.success).toBe(true)
    expect(processData.searchResultId).toBeTruthy()

    const loginRes = await request.post('/api/auth/auto-login', {
      data: { code: createData.code },
    })
    expect(loginRes.status()).toBe(200)
    const loginData = await loginRes.json() as { success: boolean }
    expect(loginData.success).toBe(true)

    const reportRes = await request.get(`/api/report/${processData.searchResultId}`)
    expect(reportRes.status()).toBe(200)
    const report = await reportRes.json() as {
      id: string
      summary: string
      data: Record<string, unknown>
    }

    expect(report.id).toBe(processData.searchResultId)
    expect(typeof report.summary).toBe('string')
    expect(report.summary.length).toBeGreaterThan(0)
    expect(report.data).toBeTruthy()
  })
})
