import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkApifullBalance } from '@/lib/apifull-balance'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('checkApifullBalance', () => {
  beforeEach(() => {
    vi.stubEnv('APIFULL_API_KEY', 'test-key')
    vi.stubEnv('APIFULL_MIN_BALANCE', '')
    mockFetch.mockReset()
  })

  it('returns balance when API responds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dados: { Saldo: 150.5 } }),
    })

    const result = await checkApifullBalance()
    expect(result).toEqual({ balance: 150.5, sufficient: true })
  })

  it('returns insufficient when balance below default threshold (20)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dados: { Saldo: 15 } }),
    })

    const result = await checkApifullBalance()
    expect(result).toEqual({ balance: 15, sufficient: false })
  })

  it('returns sufficient=true when no API key (skip check)', async () => {
    vi.stubEnv('APIFULL_API_KEY', '')

    const result = await checkApifullBalance()
    expect(result).toEqual({ balance: -1, sufficient: true })
  })

  it('returns sufficient=true on fetch error (fail open)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await checkApifullBalance()
    expect(result).toEqual({ balance: -1, sufficient: true })
  })

  it('returns sufficient=true on non-ok response (fail open)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const result = await checkApifullBalance()
    expect(result).toEqual({ balance: -1, sufficient: true })
  })
})
