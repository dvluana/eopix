import { isBypassMode } from './mock-mode'

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
  if (isBypassMode) {
    console.log(`🧪 [BYPASS] Asaas bypass - criando fake checkout: R$${params.amount / 100}`)
    const fakePaymentId = `pay_bypass_${Date.now()}`
    // Bypass: redirect direto pra confirmacao (pula checkout Asaas)
    return {
      paymentId: fakePaymentId,
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/compra/confirmacao?code=${params.externalRef}&bypass=true`,
    }
  }

  // === CHAMADA REAL ===
  const baseUrl = getAsaasBaseUrl()

  // Usar paymentLinks ao invés de payments
  // Isso permite que o Asaas colete CPF/CNPJ do comprador no checkout
  // (criar payment direto exige CPF/CNPJ no momento da criação)
  const response = await fetch(`${baseUrl}/paymentLinks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: process.env.ASAAS_API_KEY!,
    },
    body: JSON.stringify({
      name: params.description,
      billingType: 'PIX',
      chargeType: 'DETACHED', // cobrança avulsa
      value: params.amount / 100, // Asaas usa reais
      description: params.description,
      externalReference: params.externalRef,
      dueDateLimitDays: 1, // expira em 1 dia
      notificationEnabled: true,
    }),
  })

  const data = await response.json()

  if (!response.ok || !data.url) {
    console.error('Asaas paymentLink error:', data)
    throw new Error(`Asaas error: ${JSON.stringify(data)}`)
  }

  return {
    paymentId: data.id,
    checkoutUrl: data.url,
  }
}

export async function refundPayment(paymentId: string): Promise<RefundResponse> {
  if (isBypassMode) {
    console.log(`🧪 [BYPASS] Asaas refundPayment: ${paymentId}`)
    await new Promise((r) => setTimeout(r, 300))
    return {
      success: true,
      refundId: `refund_bypass_${Date.now()}`,
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
  // NUNCA aceitar token mock - sempre validar com env var
  return token === process.env.ASAAS_WEBHOOK_TOKEN
}
