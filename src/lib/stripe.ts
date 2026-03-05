import Stripe from 'stripe'
import { isBypassPayment } from './mock-mode'

// Lazy initialization to avoid errors during build
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeInstance
}

export interface CreateCheckoutSessionParams {
  email: string
  externalRef: string // codigo da purchase
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionResponse {
  sessionId: string
  checkoutUrl: string
}

export interface RefundResponse {
  success: boolean
  refundId?: string
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> {
  if (isBypassPayment) {
    console.log(`🧪 [BYPASS] Stripe bypass - criando fake checkout: ${params.externalRef}`)
    const fakeSessionId = `cs_bypass_${Date.now()}`
    // Bypass: redirect direto pra confirmacao (pula checkout Stripe)
    return {
      sessionId: fakeSessionId,
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/compra/confirmacao?code=${params.externalRef}&bypass=true`,
    }
  }

  // === CHAMADA REAL ===
  console.log('[Stripe] Creating checkout session:', {
    email: params.email,
    externalRef: params.externalRef,
    priceId: process.env.STRIPE_PRICE_ID,
  })

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: params.email,
    client_reference_id: params.externalRef,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  })

  console.log('[Stripe] Session created:', {
    sessionId: session.id,
    hasUrl: !!session.url,
  })

  if (!session.url) {
    throw new Error('Stripe session URL is null')
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  }
}

export async function refundPayment(paymentIntentId: string): Promise<RefundResponse> {
  if (isBypassPayment) {
    console.log(`🧪 [BYPASS] Stripe refundPayment: ${paymentIntentId}`)
    await new Promise((r) => setTimeout(r, 300))
    return {
      success: true,
      refundId: `re_bypass_${Date.now()}`,
    }
  }

  // === CHAMADA REAL ===
  console.log('[Stripe] Processing refund for:', paymentIntentId)

  try {
    const refund = await getStripe().refunds.create({
      payment_intent: paymentIntentId,
    })

    console.log('[Stripe] Refund result:', {
      id: refund.id,
      status: refund.status,
    })

    return {
      success: refund.status === 'succeeded' || refund.status === 'pending',
      refundId: refund.id,
    }
  } catch (error) {
    console.error('[Stripe] Refund error:', error)
    return { success: false }
  }
}

export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

// Export stripe getter for advanced usage
export { getStripe }
