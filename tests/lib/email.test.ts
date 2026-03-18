import { describe, it, expect, vi, beforeEach } from 'vitest'

// JWT_SECRET necessário para buildUnsubscribeUrl nos emails de abandono
process.env.JWT_SECRET = 'test-secret-for-vitest'

// vi.hoisted garante que mockSend é criado antes do hoist do vi.mock
const mockSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null })
)

vi.mock('resend', () => {
  class MockResend {
    emails = { send: mockSend }
  }
  return { Resend: MockResend }
})

vi.mock('@/lib/mock-mode', () => ({ isBypassMode: false }))

import {
  sendWelcomeEmail,
  sendPurchaseReceivedEmail,
  sendPurchaseApprovedEmail,
  sendPurchaseDeniedEmail,
  sendPurchaseRefundedEmail,
  sendPurchaseExpiredEmail,
  sendAbandonmentEmail1,
  sendAbandonmentEmail2,
  sendAbandonmentEmail3,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '@/lib/email'

describe('email functions', () => {
  beforeEach(() => {
    mockSend.mockClear()
  })

  it('sendWelcomeEmail — retorna id', async () => {
    const res = await sendWelcomeEmail('ana@test.com', 'Ana Silva', 'user-123')
    expect(res.id).toBe('mock-id')
  })

  it('sendPurchaseReceivedEmail — retorna id', async () => {
    const res = await sendPurchaseReceivedEmail(
      'ana@test.com', 'Ana', 'XKPQ2R', '12345678900', 'purchase-456'
    )
    expect(res.id).toBe('mock-id')
  })

  it('sendPurchaseApprovedEmail — retorna id', async () => {
    const res = await sendPurchaseApprovedEmail('ana@test.com', 'Ana', 'XKPQ2R', '', 'purchase-456')
    expect(res.id).toBe('mock-id')
  })

  it('sendPurchaseDeniedEmail — retorna id', async () => {
    const res = await sendPurchaseDeniedEmail('ana@test.com', 'Ana', 'XKPQ2R', 'purchase-456')
    expect(res.id).toBe('mock-id')
  })

  it('sendPurchaseRefundedEmail — retorna id', async () => {
    const res = await sendPurchaseRefundedEmail('ana@test.com', 'Ana', 'XKPQ2R', 'purchase-456')
    expect(res.id).toBe('mock-id')
  })

  it('sendPurchaseExpiredEmail — retorna id', async () => {
    const res = await sendPurchaseExpiredEmail('ana@test.com', 'Ana', 'XKPQ2R', '12345678900', 'purchase-456')
    expect(res.id).toBe('mock-id')
  })

  it('sendAbandonmentEmail1 — CPF formatado no HTML', async () => {
    await sendAbandonmentEmail1('ana@test.com', 'Ana', '12345678900')
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs.html).toContain('123.456.789-00')
  })

  it('sendAbandonmentEmail2 — retorna id', async () => {
    const res = await sendAbandonmentEmail2('ana@test.com', 'Ana', '12345678900')
    expect(res.id).toBe('mock-id')
  })

  it('sendAbandonmentEmail3 — retorna id', async () => {
    const res = await sendAbandonmentEmail3('ana@test.com', 'Ana', '12345678900')
    expect(res.id).toBe('mock-id')
  })

  it('sendPasswordResetEmail — retorna id e inclui token na URL', async () => {
    const token = 'abc123deadbeef'
    const res = await sendPasswordResetEmail('ana@test.com', 'Ana Silva', token)
    expect(res.id).toBe('mock-id')
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs.html).toContain(token)
    expect(callArgs.subject).toContain('Redefinir')
  })

  it('sendPasswordChangedEmail — retorna id e badge vermelho no HTML', async () => {
    const res = await sendPasswordChangedEmail('ana@test.com', 'Ana Silva')
    expect(res.id).toBe('mock-id')
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs.html).toContain('SENHA ALTERADA')
    expect(callArgs.html).toContain('#CC3333')
  })
})
