/**
 * Unit tests for PIX frontend wiring.
 * Verifies that route modules export the expected HTTP handlers.
 */

import { describe, it, expect, vi } from 'vitest'

// Mock heavy dependencies that require env vars at import time
vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: vi.fn(),
  sendPurchaseReceivedEmail: vi.fn(),
  sendPurchaseApprovedEmail: vi.fn(),
  sendPurchaseDeniedEmail: vi.fn(),
  sendPurchaseRefundedEmail: vi.fn(),
  sendPurchaseExpiredEmail: vi.fn(),
  sendAbandonmentEmail1: vi.fn(),
  sendAbandonmentEmail2: vi.fn(),
  sendAbandonmentEmail3: vi.fn(),
}))

vi.mock('@/lib/inngest', () => ({
  inngest: { send: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    blocklist: { findUnique: vi.fn() },
    purchase: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    leadCapture: { create: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  getSessionWithUser: vi.fn(),
  isAdminEmail: vi.fn(),
}))

vi.mock('@/lib/abacatepay', () => ({
  createOrGetCustomer: vi.fn(),
  createPixCharge: vi.fn(),
  checkPixStatus: vi.fn(),
}))

vi.mock('@/lib/payment', () => ({
  createCheckout: vi.fn(),
  getPaymentProvider: vi.fn().mockReturnValue('abacatepay'),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  withScope: vi.fn(),
}))

describe('PIX Frontend Wiring', () => {
  it('purchases route module exports POST handler', async () => {
    const mod = await import('@/app/api/purchases/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('pix route module exports POST handler', async () => {
    const mod = await import('@/app/api/purchases/pix/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('pix status route module exports GET handler', async () => {
    const mod = await import('@/app/api/purchases/pix/status/route')
    expect(typeof mod.GET).toBe('function')
  })
})
