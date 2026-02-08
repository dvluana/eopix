import { isMockMode } from './mock-mode'

export interface CreatePixChargeParams {
  amount: number // em centavos
  email: string
  externalRef: string // codigo da compra
  description: string
}

export interface PixChargeResponse {
  paymentId: string
  checkoutUrl: string
}

export interface RefundResponse {
  success: boolean
  refundId?: string
}

function getAsaasBaseUrl(): string {
  const env = process.env.ASAAS_ENV || 'sandbox'
  return env === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3'
}

export async function createPixCharge(
  params: CreatePixChargeParams
): Promise<PixChargeResponse> {
  if (isMockMode) {
    console.log(`[MOCK] Asaas createPixCharge: R$${params.amount / 100}`)
    const fakePaymentId = `pay_mock_${Date.now()}`
    // Mock: redirect direto pra confirmacao (pula checkout)
    return {
      paymentId: fakePaymentId,
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/compra/confirmacao?code=${params.externalRef}&mock=true`,
    }
  }

  // === CHAMADA REAL (Parte B) ===
  const baseUrl = getAsaasBaseUrl()

  // Primeiro, buscar ou criar customer
  const customerRes = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: process.env.ASAAS_API_KEY!,
    },
    body: JSON.stringify({
      email: params.email,
      name: params.email.split('@')[0], // placeholder, Asaas coleta nome no checkout
    }),
  })

  const customer = await customerRes.json()

  // Criar cobranca Pix
  const paymentRes = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: process.env.ASAAS_API_KEY!,
    },
    body: JSON.stringify({
      customer: customer.id,
      billingType: 'PIX',
      value: params.amount / 100, // Asaas usa reais
      description: params.description,
      externalReference: params.externalRef,
      dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString().split('T')[0], // 30 min
    }),
  })

  const payment = await paymentRes.json()

  return {
    paymentId: payment.id,
    checkoutUrl: payment.invoiceUrl,
  }
}

export async function refundPayment(paymentId: string): Promise<RefundResponse> {
  if (isMockMode) {
    console.log(`[MOCK] Asaas refundPayment: ${paymentId}`)
    await new Promise((r) => setTimeout(r, 300))
    return {
      success: true,
      refundId: `refund_mock_${Date.now()}`,
    }
  }

  // === CHAMADA REAL (Parte B) ===
  const baseUrl = getAsaasBaseUrl()

  const res = await fetch(`${baseUrl}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: process.env.ASAAS_API_KEY!,
    },
  })

  if (!res.ok) {
    return { success: false }
  }

  const data = await res.json()
  return {
    success: true,
    refundId: data.id,
  }
}

export function validateWebhookToken(token: string | null): boolean {
  if (isMockMode) {
    // Em mock mode, aceita o token mock
    return token === 'mock-token-local' || token === process.env.ASAAS_WEBHOOK_TOKEN
  }

  return token === process.env.ASAAS_WEBHOOK_TOKEN
}
