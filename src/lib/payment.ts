/**
 * Payment provider layer — AbacatePay only.
 */

export type PaymentProvider = 'abacatepay'

export function getPaymentProvider(): PaymentProvider {
  return 'abacatepay'
}

export interface CreateCheckoutParams {
  email?: string
  name?: string
  cellphone?: string
  taxId?: string
  externalRef: string
  successUrl: string
  cancelUrl: string
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
  const { createCheckout: abacateCheckout } = await import('./abacatepay')
  return abacateCheckout(params)
}

export async function processRefund(
  externalId: string,
): Promise<RefundResponse> {
  const { processRefund: abacateRefund } = await import('./abacatepay')
  return abacateRefund(externalId)
}

export function getProviderDisplayName(): string {
  return 'AbacatePay'
}
