import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock mock-mode before importing abacatepay
vi.mock('@/lib/mock-mode', () => ({
  isBypassPayment: false,
}))

import { createPixCharge, checkPixStatus, simulatePixPayment } from '@/lib/abacatepay'

const mockFetch = vi.fn()
global.fetch = mockFetch

const API_KEY = 'test-api-key'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.ABACATEPAY_API_KEY = API_KEY
})

describe('createPixCharge', () => {
  it('calls correct URL with correct method, headers, and body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'pix_char_123',
          brCode: '00020101...',
          brCodeBase64: 'data:image/png;base64,ABC',
          expiresAt: '2026-03-26T01:00:00Z',
          status: 'PENDING',
        },
      }),
    })

    const result = await createPixCharge({
      purchaseCode: 'ABCD12',
      amount: 3990,
      customer: { name: 'Test User', email: 'test@test.com', taxId: '12345678901', cellphone: '11999999999' },
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.abacatepay.com/v1/pixQrCode/create')
    expect(options.method).toBe('POST')
    expect(options.headers['Authorization']).toBe(`Bearer ${API_KEY}`)
    expect(options.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(options.body)
    expect(body.amount).toBe(3990)
    expect(body.expiresIn).toBe(3600)
    expect(body.description).toBe('Relatório EOPIX')
    expect(body.metadata.externalId).toBe('ABCD12')
    expect(body.customer.name).toBe('Test User')
    expect(body.customer.taxId).toBe('12345678901')

    expect(result.pixId).toBe('pix_char_123')
    expect(result.brCode).toBe('00020101...')
    expect(result.brCodeBase64).toBe('data:image/png;base64,ABC')
    expect(result.expiresAt).toBe('2026-03-26T01:00:00Z')
    expect(result.status).toBe('PENDING')
  })

  it('does not include customer if not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'pix_char_456',
          brCode: 'BRCODE',
          brCodeBase64: 'BASE64',
          expiresAt: '2026-03-26T01:00:00Z',
          status: 'PENDING',
        },
      }),
    })

    await createPixCharge({ purchaseCode: 'XY1234', amount: 3990 })
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.customer).toBeUndefined()
  })

  it('returns mock without calling fetch when isBypassPayment is true', async () => {
    vi.resetModules()
    vi.doMock('@/lib/mock-mode', () => ({ isBypassPayment: true }))
    const { createPixCharge: createPixChargeBypass } = await import('@/lib/abacatepay')

    const result = await createPixChargeBypass({ purchaseCode: 'BYPASS1', amount: 3990 })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.pixId).toMatch(/^pix_bypass_/)
    expect(result.brCode).toBe('BYPASS_BR_CODE')
    expect(result.brCodeBase64).toBe('data:image/png;base64,BYPASS')
    expect(result.status).toBe('PENDING')

    vi.doUnmock('@/lib/mock-mode')
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Invalid amount' }),
    })

    await expect(createPixCharge({ purchaseCode: 'ERR123', amount: 0 })).rejects.toThrow('Invalid amount')
  })

  it('throws when data.id is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    })

    await expect(createPixCharge({ purchaseCode: 'ERR456', amount: 3990 })).rejects.toThrow()
  })
})

describe('checkPixStatus', () => {
  it('calls correct URL with GET and returns status/expiresAt', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          status: 'PAID',
          expiresAt: '2026-03-26T01:00:00Z',
        },
      }),
    })

    const result = await checkPixStatus('pix_char_789')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.abacatepay.com/v1/pixQrCode/check?id=pix_char_789')
    expect(options?.method).toBeUndefined() // GET is default
    expect(options?.headers?.['Authorization']).toBe(`Bearer ${API_KEY}`)

    expect(result.status).toBe('PAID')
    expect(result.expiresAt).toBe('2026-03-26T01:00:00Z')
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    })

    await expect(checkPixStatus('pix_nonexistent')).rejects.toThrow()
  })
})

describe('simulatePixPayment', () => {
  it('calls correct URL with POST method', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { status: 'PAID' } }),
    })

    await simulatePixPayment('pix_char_sim')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.abacatepay.com/v1/pixQrCode/simulate-payment?id=pix_char_sim')
    expect(options.method).toBe('POST')
    expect(options.headers['Authorization']).toBe(`Bearer ${API_KEY}`)
  })
})
