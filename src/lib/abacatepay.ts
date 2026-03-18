import crypto from 'node:crypto'
import { isBypassPayment } from './mock-mode'

export interface CreateCheckoutParams {
  externalRef: string // purchase code — set as checkout externalId, echoed in webhook
  successUrl: string
  cancelUrl: string
}

export interface CheckoutResponse {
  sessionId: string  // AbacatePay checkout id (bill_xxx) — stored in paymentExternalId
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
    console.log(`[BYPASS] AbacatePay bypass: ${params.externalRef}`)
    const fakeId = `bill_bypass_${Date.now()}`
    return {
      sessionId: fakeId,
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/compra/confirmacao?code=${params.externalRef}&bypass=true`,
    }
  }

  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) {
    throw new Error('ABACATEPAY_API_KEY is not configured')
  }

  const productId = process.env.ABACATEPAY_PRODUCT_ID
  if (!productId) {
    throw new Error('ABACATEPAY_PRODUCT_ID is not configured')
  }

  console.log('[AbacatePay] Creating checkout v2:', {
    externalRef: params.externalRef,
    productId,
    completionUrl: params.successUrl,
    returnUrl: params.cancelUrl,
  })

  const body = {
    items: [{ id: productId, quantity: 1 }],
    externalId: params.externalRef,
    methods: ['PIX', 'CARD'],
    completionUrl: params.successUrl,
    returnUrl: params.cancelUrl,
  }

  const res = await fetch('https://api.abacatepay.com/v2/checkouts/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const responseData = await res.json()

  if (!res.ok || !responseData.success || !responseData.data) {
    const errorDetail = JSON.stringify(responseData)
    console.error(`[AbacatePay] Checkout error: status=${res.status} body=${errorDetail}`)
    const errorMsg = responseData.error || `HTTP ${res.status}`
    throw new Error(`AbacatePay checkout error: ${errorMsg}`)
  }

  const { data } = responseData

  console.log('[AbacatePay] Checkout created:', {
    checkoutId: data.id,
    hasUrl: !!data.url,
  })

  return {
    sessionId: data.id,
    checkoutUrl: data.url,
  }
}

export async function processRefund(_billingId: string): Promise<RefundResponse> {
  if (isBypassPayment) {
    console.log(`[BYPASS] AbacatePay refund: ${_billingId}`)
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
