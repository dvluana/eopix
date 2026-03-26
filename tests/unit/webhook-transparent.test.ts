/**
 * Unit tests for transparent.completed webhook event handling.
 * Tests that PIX QR Code payments advance purchase to PAID and trigger Inngest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mock abacatepay validation ---
vi.mock('@/lib/abacatepay', () => ({
  validateWebhookSecret: vi.fn().mockReturnValue(true),
  validateWebhookSignature: vi.fn().mockReturnValue(true),
  createOrGetCustomer: vi.fn(),
}))

// --- Mock Prisma ---
const mockPrisma = {
  purchase: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  webhookLog: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

// --- Mock Inngest ---
const mockInngest = { send: vi.fn().mockResolvedValue(undefined) }
vi.mock('@/lib/inngest', () => ({ inngest: mockInngest }))

// --- Mock email ---
vi.mock('@/lib/email', () => ({
  sendPurchaseReceivedEmail: vi.fn().mockResolvedValue(undefined),
}))

// --- Mock Sentry ---
vi.mock('@sentry/nextjs', () => ({
  withScope: vi.fn((cb: (scope: unknown) => void) => cb({ setTag: vi.fn() })),
  captureException: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()

  // Default: no existing WebhookLog (new event)
  mockPrisma.webhookLog.findUnique.mockResolvedValue(null)
  mockPrisma.webhookLog.create.mockResolvedValue({})

  // Default purchase
  mockPrisma.purchase.findUnique.mockResolvedValue({
    id: 'purch-1',
    code: 'TESTPX',
    status: 'PENDING',
    term: '12345678901',
    amount: 3990,
    userId: 'user-1',
    paymentExternalId: 'pix_char_abc',
    user: { id: 'user-1', email: 'user@test.com', name: 'Test User' },
  })
  mockPrisma.purchase.findFirst.mockResolvedValue(null)
  mockPrisma.purchase.update.mockResolvedValue({})
  mockPrisma.user.findUnique.mockResolvedValue(null)
  mockPrisma.user.update.mockResolvedValue({})

  process.env.ABACATEPAY_WEBHOOK_SECRET = 'test-secret'
})

function makeTransparentRequest(overrides: Record<string, unknown> = {}) {
  const payload = {
    event: 'transparent.completed',
    data: {
      transparent: {
        id: 'pix_char_abc',
        amount: 3990,
        paidAmount: 3990,
        status: 'PAID',
        methods: ['PIX'],
        metadata: { externalId: 'TESTPX' },
        ...overrides,
      },
    },
  }

  return new NextRequest('http://localhost/api/webhooks/abacatepay?webhookSecret=test-secret', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Webhook transparent.completed', () => {
  it('advances purchase to PAID and triggers Inngest', async () => {
    const { POST } = await import('@/app/api/webhooks/abacatepay/route')
    const req = makeTransparentRequest()
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)

    // Purchase updated to PAID
    expect(mockPrisma.purchase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'purch-1' },
        data: expect.objectContaining({ status: 'PAID' }),
      })
    )

    // Inngest triggered
    expect(mockInngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'search/process',
        data: expect.objectContaining({ purchaseCode: 'TESTPX' }),
      })
    )

    // WebhookLog created with transparent namespace
    expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventKey: 'abacate:transparent:pix_char_abc',
        }),
      })
    )
  })

  it('ignores duplicate transparent.completed (idempotency)', async () => {
    mockPrisma.webhookLog.findUnique.mockResolvedValue({
      id: 'log-1',
      eventKey: 'abacate:transparent:pix_char_abc',
    })

    const { POST } = await import('@/app/api/webhooks/abacatepay/route')
    const req = makeTransparentRequest()
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.duplicate).toBe(true)

    // No update or Inngest call
    expect(mockPrisma.purchase.update).not.toHaveBeenCalled()
    expect(mockInngest.send).not.toHaveBeenCalled()
  })

  it('resolves purchase code from metadata.externalId', async () => {
    // Purchase found by code from metadata
    mockPrisma.purchase.findUnique.mockResolvedValue({
      id: 'purch-2',
      code: 'META99',
      status: 'PENDING',
      term: '12345678901',
      amount: 3990,
      userId: 'user-1',
      paymentExternalId: 'pix_char_meta',
      user: { id: 'user-1', email: 'user@test.com', name: 'Test User' },
    })

    const payload = {
      event: 'transparent.completed',
      data: {
        transparent: {
          id: 'pix_char_meta',
          amount: 3990,
          status: 'PAID',
          metadata: { externalId: 'META99' },
        },
      },
    }

    const req = new NextRequest('http://localhost/api/webhooks/abacatepay?webhookSecret=test-secret', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('@/app/api/webhooks/abacatepay/route')
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockPrisma.purchase.update).toHaveBeenCalled()
  })

  it('falls back to paymentExternalId lookup when metadata.externalId is missing', async () => {
    // No metadata.externalId — fallback via findFirst by paymentExternalId
    mockPrisma.purchase.findFirst.mockResolvedValue({
      id: 'purch-3',
      code: 'FALLBK',
      status: 'PENDING',
      term: '12345678901',
      amount: 3990,
      userId: 'user-1',
      paymentExternalId: 'pix_char_fallback',
      user: { id: 'user-1', email: 'user@test.com', name: 'Test User' },
    })

    // findUnique returns the purchase when searched by code (FALLBK)
    mockPrisma.purchase.findUnique.mockImplementation(({ where }: { where: { code?: string } }) => {
      if (where.code === 'FALLBK') {
        return Promise.resolve({
          id: 'purch-3',
          code: 'FALLBK',
          status: 'PENDING',
          term: '12345678901',
          amount: 3990,
          userId: 'user-1',
          paymentExternalId: 'pix_char_fallback',
          user: { id: 'user-1', email: 'user@test.com', name: 'Test User' },
        })
      }
      return Promise.resolve(null)
    })

    const payload = {
      event: 'transparent.completed',
      data: {
        transparent: {
          id: 'pix_char_fallback',
          amount: 3990,
          status: 'PAID',
          // no metadata.externalId
        },
      },
    }

    const req = new NextRequest('http://localhost/api/webhooks/abacatepay?webhookSecret=test-secret', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('@/app/api/webhooks/abacatepay/route')
    const res = await POST(req)

    expect(res.status).toBe(200)
    // findFirst used as fallback lookup by paymentExternalId
    expect(mockPrisma.purchase.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { paymentExternalId: 'pix_char_fallback' },
      })
    )
  })

  it('ignores non-payment events', async () => {
    const payload = { event: 'payment.created', data: {} }
    const req = new NextRequest('http://localhost/api/webhooks/abacatepay?webhookSecret=test-secret', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('@/app/api/webhooks/abacatepay/route')
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockPrisma.purchase.update).not.toHaveBeenCalled()
  })
})
