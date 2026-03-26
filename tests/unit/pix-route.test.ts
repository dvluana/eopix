/**
 * Unit tests for POST /api/purchases/pix route.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mock auth ---
vi.mock('@/lib/auth', () => ({
  getSessionWithUser: vi.fn(),
}))

// --- Mock Prisma ---
const mockPrisma = {
  purchase: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

// --- Mock createPixCharge ---
const mockCreatePixCharge = vi.fn()
vi.mock('@/lib/abacatepay', () => ({
  createPixCharge: mockCreatePixCharge,
}))

// --- Mock Sentry ---
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/purchases/pix', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/purchases/pix', () => {
  it('returns 401 when no session', async () => {
    const { getSessionWithUser: getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue(null)

    const { POST } = await import('@/app/api/purchases/pix/route')
    const res = await POST(makeRequest({ purchaseId: 'purch-1' }))

    expect(res.status).toBe(401)
  })

  it('returns 404 when purchase not found or not owned by user', async () => {
    const { getSessionWithUser: getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', email: 'a@b.com', iat: 0, exp: 9999999999 })
    mockPrisma.purchase.findFirst.mockResolvedValue(null)

    const { POST } = await import('@/app/api/purchases/pix/route')
    const res = await POST(makeRequest({ purchaseId: 'nonexistent' }))

    expect(res.status).toBe(404)
  })

  it('returns 400 when purchase is not PENDING', async () => {
    const { getSessionWithUser: getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', email: 'a@b.com', iat: 0, exp: 9999999999 })
    mockPrisma.purchase.findFirst.mockResolvedValue({
      id: 'purch-1',
      code: 'TESTPX',
      status: 'COMPLETED',
      userId: 'user-1',
      amount: 3990,
      term: '12345678901',
      paymentExternalId: null,
      pixBrCode: null,
      user: { name: 'Test User', email: 'a@b.com', taxId: null, cellphone: null },
    })

    const { POST } = await import('@/app/api/purchases/pix/route')
    const res = await POST(makeRequest({ purchaseId: 'purch-1' }))

    expect(res.status).toBe(400)
  })

  it('returns 200 with brCode and brCodeBase64 on success', async () => {
    const { getSessionWithUser: getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', email: 'a@b.com', iat: 0, exp: 9999999999 })
    mockPrisma.purchase.findFirst.mockResolvedValue({
      id: 'purch-1',
      code: 'TESTPX',
      status: 'PENDING',
      userId: 'user-1',
      amount: 3990,
      term: '12345678901',
      paymentExternalId: null,
      pixBrCode: null,
      user: { name: 'Test User', email: 'a@b.com', taxId: '12345678901', cellphone: '11999999999' },
    })
    mockCreatePixCharge.mockResolvedValue({
      pixId: 'pix_char_new',
      brCode: '000201...',
      brCodeBase64: 'data:image/png;base64,XYZ',
      expiresAt: '2026-03-26T01:00:00Z',
      status: 'PENDING',
    })
    mockPrisma.purchase.update.mockResolvedValue({})

    const { POST } = await import('@/app/api/purchases/pix/route')
    const res = await POST(makeRequest({ purchaseId: 'purch-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.pixId).toBe('pix_char_new')
    expect(body.brCode).toBe('000201...')
    expect(body.brCodeBase64).toBe('data:image/png;base64,XYZ')
    expect(body.expiresAt).toBe('2026-03-26T01:00:00Z')

    expect(mockPrisma.purchase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentExternalId: 'pix_char_new',
          pixBrCode: '000201...',
          pixBrCodeBase64: 'data:image/png;base64,XYZ',
        }),
      })
    )
  })

  it('reuses existing PIX charge when paymentExternalId starts with pix_ and pixBrCode exists', async () => {
    const { getSessionWithUser: getSession } = await import('@/lib/auth')
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', email: 'a@b.com', iat: 0, exp: 9999999999 })
    mockPrisma.purchase.findFirst.mockResolvedValue({
      id: 'purch-1',
      code: 'TESTPX',
      status: 'PENDING',
      userId: 'user-1',
      amount: 3990,
      term: '12345678901',
      paymentExternalId: 'pix_char_existing',
      pixBrCode: 'EXISTING_BR_CODE',
      pixBrCodeBase64: 'data:image/png;base64,EXISTING',
      pixExpiresAt: new Date('2026-03-26T02:00:00Z'),
      user: { name: 'Test User', email: 'a@b.com', taxId: null, cellphone: null },
    })

    const { POST } = await import('@/app/api/purchases/pix/route')
    const res = await POST(makeRequest({ purchaseId: 'purch-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.pixId).toBe('pix_char_existing')
    expect(body.brCode).toBe('EXISTING_BR_CODE')

    // Should NOT call AbacatePay again
    expect(mockCreatePixCharge).not.toHaveBeenCalled()
    // Should NOT update purchase
    expect(mockPrisma.purchase.update).not.toHaveBeenCalled()
  })
})
