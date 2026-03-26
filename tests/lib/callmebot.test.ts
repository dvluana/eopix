import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted garante que mockFetch é criado antes do hoist do vi.mock
const mockFetch = vi.hoisted(() => vi.fn())

vi.stubGlobal('fetch', mockFetch)

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import { sendFailureAlert, sendCompletedAlert } from '@/lib/callmebot'
import * as Sentry from '@sentry/nextjs'

const BASE_DATE = new Date('2026-03-25T14:30:00Z')

describe('callmebot', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.mocked(Sentry.captureException).mockClear()

    // Set up env vars for 3 recipients
    process.env.CALLMEBOT_PHONE = '+5511999990001'
    process.env.CALLMEBOT_API_KEY = 'key-1'
    process.env.CALLMEBOT_PHONE_2 = '+5511999990002'
    process.env.CALLMEBOT_API_KEY_2 = 'key-2'
    process.env.CALLMEBOT_PHONE_3 = '+5511999990003'
    process.env.CALLMEBOT_API_KEY_3 = 'key-3'

    mockFetch.mockResolvedValue({ ok: true })
  })

  it('sendFailureAlert — constrói mensagem com campos corretos', async () => {
    await sendFailureAlert({
      code: 'ABC123',
      createdAt: BASE_DATE,
      userName: 'Joao Silva',
      userEmail: 'joao@test.com',
      paymentProvider: 'abacatepay',
      processingStep: 2,
      errorMessage: 'Timeout na API',
    })

    expect(mockFetch).toHaveBeenCalled()
    const url = mockFetch.mock.calls[0][0] as string
    const decoded = decodeURIComponent(url)

    expect(decoded).toContain('FALHA NO PIPELINE')
    expect(decoded).toContain('ABC123')
    expect(decoded).toContain('Joao Silva')
    expect(decoded).toContain('joao@test.com')
    expect(decoded).toContain('PIX (AbacatePay)')
    expect(decoded).toContain('Step: 2/6')
    expect(decoded).toContain('Verificando situacao financeira')
    expect(decoded).toContain('Timeout na API')
    expect(decoded).toContain('eopix.com.br/admin/compras?search=ABC123')
  })

  it('sendCompletedAlert — constrói mensagem com campos corretos', async () => {
    await sendCompletedAlert({
      code: 'XYZ789',
      createdAt: BASE_DATE,
      userName: 'Maria Santos',
      userEmail: 'maria@test.com',
      paymentProvider: 'abacatepay',
    })

    expect(mockFetch).toHaveBeenCalled()
    const url = mockFetch.mock.calls[0][0] as string
    const decoded = decodeURIComponent(url)

    expect(decoded).toContain('RELATÓRIO ENTREGUE')
    expect(decoded).toContain('XYZ789')
    expect(decoded).toContain('Maria Santos')
    expect(decoded).toContain('maria@test.com')
    expect(decoded).toContain('PIX (AbacatePay)')
    expect(decoded).toContain('eopix.com.br/admin/compras?search=XYZ789')
  })

  it('erro > 100 chars é truncado com "..."', async () => {
    const longError = 'A'.repeat(150)

    await sendFailureAlert({
      code: 'TRUNC1',
      createdAt: BASE_DATE,
      userName: null,
      userEmail: 'x@test.com',
      paymentProvider: null,
      processingStep: 0,
      errorMessage: longError,
    })

    const url = mockFetch.mock.calls[0][0] as string
    const decoded = decodeURIComponent(url)
    // Should contain 100 A's followed by '...' (not 150)
    expect(decoded).toContain('A'.repeat(100) + '...')
    expect(decoded).not.toContain('A'.repeat(101))
  })

  it('erro <= 100 chars NÃO é truncado', async () => {
    const exactError = 'B'.repeat(100)

    await sendFailureAlert({
      code: 'TRUNC2',
      createdAt: BASE_DATE,
      userName: null,
      userEmail: 'x@test.com',
      paymentProvider: null,
      processingStep: 0,
      errorMessage: exactError,
    })

    const url = mockFetch.mock.calls[0][0] as string
    const decoded = decodeURIComponent(url)
    expect(decoded).toContain('B'.repeat(100))
    expect(decoded).not.toContain('B'.repeat(100) + '...')
  })

  it('nenhum env var configurado — sem chamadas fetch, console.warn chamado', async () => {
    delete process.env.CALLMEBOT_PHONE
    delete process.env.CALLMEBOT_API_KEY
    delete process.env.CALLMEBOT_PHONE_2
    delete process.env.CALLMEBOT_API_KEY_2
    delete process.env.CALLMEBOT_PHONE_3
    delete process.env.CALLMEBOT_API_KEY_3

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await sendFailureAlert({
      code: 'NOENV',
      createdAt: BASE_DATE,
      userName: null,
      userEmail: 'x@test.com',
      paymentProvider: null,
      processingStep: 0,
      errorMessage: 'some error',
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No recipients configured'))

    warnSpy.mockRestore()
  })

  it('falha de um destinatário não bloqueia os outros', async () => {
    // First call rejects, others resolve
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ ok: true })

    await sendFailureAlert({
      code: 'PARTIAL',
      createdAt: BASE_DATE,
      userName: null,
      userEmail: 'x@test.com',
      paymentProvider: null,
      processingStep: 1,
      errorMessage: 'err',
    })

    // Should still call fetch for all 3 recipients
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(Sentry.captureException).toHaveBeenCalled()
  })

  it('paymentProvider mapping: abacatepay, stripe, null', async () => {
    const cases: Array<[string | null, string]> = [
      ['abacatepay', 'PIX (AbacatePay)'],
      ['stripe', 'Cartão (Stripe)'],
      [null, 'Pagamento'],
    ]

    for (const [provider, expected] of cases) {
      mockFetch.mockClear()
      await sendCompletedAlert({
        code: 'MAP01',
        createdAt: BASE_DATE,
        userName: null,
        userEmail: 'x@test.com',
        paymentProvider: provider,
      })
      const url = mockFetch.mock.calls[0][0] as string
      expect(decodeURIComponent(url)).toContain(expected)
    }
  })

  it('step label lookup via PROCESSING_STEPS', async () => {
    const stepCases: Array<[number, string]> = [
      [1, 'Consultando Receita Federal'],
      [3, 'Buscando processos judiciais'],
      [6, 'Montando seu relatorio'],
      [0, 'Iniciando'],
    ]

    for (const [step, expectedLabel] of stepCases) {
      mockFetch.mockClear()
      await sendFailureAlert({
        code: 'STEP01',
        createdAt: BASE_DATE,
        userName: null,
        userEmail: 'x@test.com',
        paymentProvider: null,
        processingStep: step,
        errorMessage: 'err',
      })
      const url = mockFetch.mock.calls[0][0] as string
      expect(decodeURIComponent(url)).toContain(expectedLabel)
    }
  })
})
