/**
 * Payment provider abstraction layer.
 * Delegates to Stripe or AbacatePay based on PAYMENT_PROVIDER env var.
 */

export type PaymentProvider = 'stripe' | 'abacatepay'

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || 'abacatepay'
  if (provider !== 'stripe' && provider !== 'abacatepay') {
    throw new Error(`Invalid PAYMENT_PROVIDER: ${provider}. Must be "stripe" or "abacatepay"`)
  }
  return provider
}

export interface CreateCheckoutParams {
  email?: string
  externalRef: string
  successUrl: string
  cancelUrl: string
  taxId?: string // CPF or CNPJ
}

export interface CheckoutResponse {
  sessionId: string
  checkoutUrl: string
}

export interface RefundResponse {
  success: boolean
  refundId?: string
  message?: string
}

export async function createCheckout(
  params: CreateCheckoutParams
): Promise<CheckoutResponse> {
  const provider = getPaymentProvider()

  if (provider === 'abacatepay') {
    const { createCheckout: abacateCheckout } = await import('./abacatepay')
    return abacateCheckout(params)
  }

  const { createCheckoutSession } = await import('./stripe')
  return createCheckoutSession(params)
}

export async function processRefund(
  externalId: string,
  provider?: PaymentProvider
): Promise<RefundResponse> {
  const effectiveProvider = provider || getPaymentProvider()

  if (effectiveProvider === 'abacatepay') {
    const { processRefund: abacateRefund } = await import('./abacatepay')
    return abacateRefund(externalId)
  }

  const { refundPayment } = await import('./stripe')
  return refundPayment(externalId)
}

export function getProviderDisplayName(provider?: PaymentProvider): string {
  const p = provider || getPaymentProvider()
  return p === 'abacatepay' ? 'AbacatePay' : 'Stripe'
}
