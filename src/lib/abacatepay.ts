import crypto from 'node:crypto'
import AbacatePay from 'abacatepay-nodejs-sdk'
import { isBypassPayment } from './mock-mode'

// Lazy initialization to avoid errors during build
let abacateInstance: ReturnType<typeof AbacatePay> | null = null

function getAbacate() {
  if (!abacateInstance) {
    if (!process.env.ABACATEPAY_API_KEY) {
      throw new Error('ABACATEPAY_API_KEY is not configured')
    }
    abacateInstance = AbacatePay(process.env.ABACATEPAY_API_KEY)
  }
  return abacateInstance
}

export interface CreateCheckoutParams {
  email?: string
  name?: string
  cellphone?: string // digits only, e.g. '11999999999'
  taxId?: string // CPF/CNPJ for AbacatePay customer
  externalRef: string // purchase code
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
  if (isBypassPayment) {
    console.log(`🧪 [BYPASS] AbacatePay bypass - criando fake checkout: ${params.externalRef}`)
    const fakeId = `bill_bypass_${Date.now()}`
    return {
      sessionId: fakeId,
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/compra/confirmacao?code=${params.externalRef}&bypass=true`,
    }
  }

  const priceCents = parseInt(process.env.PRICE_CENTS || '2990', 10)

  console.log('[AbacatePay] Creating billing:', {
    email: params.email,
    externalRef: params.externalRef,
    amount: priceCents,
  })

  // Customer email — use provided email or a placeholder (AbacatePay checkout collects real email)
  const customerEmail = params.email || `checkout-${params.externalRef}@noreply.eopix.app`

  // Direct fetch instead of SDK — the SDK swallows error details
  // (SDK reads `data.message` but AbacatePay returns `data.error`)
  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) {
    throw new Error('ABACATEPAY_API_KEY is not configured')
  }

  const body = {
    frequency: 'ONE_TIME',
    methods: ['PIX'],
    products: [
      {
        externalId: params.externalRef,
        name: 'Relatório de Risco CPF/CNPJ',
        quantity: 1,
        price: priceCents,
      },
    ],
    returnUrl: params.cancelUrl,
    completionUrl: params.successUrl,
    customer: {
      name: params.name || 'Cliente EOPIX',
      cellphone: params.cellphone || '11999999999',
      email: customerEmail,
      taxId: params.taxId || '00000000000',
    },
  }

  const res = await fetch('https://api.abacatepay.com/v1/billing/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const responseData = await res.json()

  if (!res.ok || responseData.error || !responseData.data) {
    console.error('[AbacatePay] Billing error:', {
      status: res.status,
      body: responseData,
    })
    const errorMsg = responseData.error || responseData.message || `HTTP ${res.status}`
    throw new Error(`AbacatePay billing error: ${errorMsg}`)
  }

  const { data } = responseData

  console.log('[AbacatePay] Billing created:', {
    billingId: data.id,
    hasUrl: !!data.url,
  })

  return {
    sessionId: data.id,
    checkoutUrl: data.url,
  }
}

export async function processRefund(_billingId: string): Promise<RefundResponse> {
  if (isBypassPayment) {
    console.log(`🧪 [BYPASS] AbacatePay refund: ${_billingId}`)
    await new Promise((r) => setTimeout(r, 300))
    return {
      success: true,
      refundId: `ref_bypass_${Date.now()}`,
    }
  }

  // AbacatePay does not have a refund API endpoint — refunds must be done via dashboard
  return {
    success: false,
    message: 'Reembolso deve ser feito pelo dashboard AbacatePay',
  }
}

// HMAC-SHA256 public key from AbacatePay docs
const ABACATEPAY_PUBLIC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9'

export function validateWebhookSecret(url: string): boolean {
  const parsed = new URL(url)
  const secret = parsed.searchParams.get('webhookSecret')
  return secret === process.env.ABACATEPAY_WEBHOOK_SECRET
}

export function validateWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const expectedSig = crypto
    .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64')

  const A = Buffer.from(expectedSig)
  const B = Buffer.from(signatureHeader)

  return A.length === B.length && crypto.timingSafeEqual(A, B)
}

export { getAbacate }
