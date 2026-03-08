import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhookSecret, validateWebhookSignature } from '@/lib/abacatepay'

// v1 billing.paid payload
interface AbacateBillingPaidEvent {
  event: 'billing.paid'
  id: string
  devMode: boolean
  data: {
    payment: { amount: number; fee: number; method: string }
    billing: {
      id: string
      externalId?: string
      amount: number
      paidAmount: number
      status: string
      frequency: string
      kind: string[]
      products: { externalId: string; id: string; quantity: number }[]
      customer: {
        id: string
        metadata: { name: string; email: string; cellphone: string; taxId: string }
      }
    }
  }
}

// v2 checkout.completed payload (kept for forward compatibility)
interface AbacateCheckoutCompletedEvent {
  event: 'checkout.completed'
  apiVersion: number
  devMode: boolean
  data: {
    checkout: {
      id: string
      externalId?: string
      amount: number
      paidAmount: number
      status: string
      items: { id: string; quantity: number }[]
    }
    customer: {
      id: string
      name: string
      email: string
      taxId: string
    } | null
  }
}

type AbacateWebhookEvent = AbacateBillingPaidEvent | AbacateCheckoutCompletedEvent

export async function POST(request: NextRequest) {
  console.log('[AbacatePay Webhook] Request received:', {
    url: request.url,
    method: request.method,
    hasSignature: !!request.headers.get('x-webhook-signature'),
    contentType: request.headers.get('content-type'),
  })

  try {
    // Layer 1: Validate webhook secret from query string
    if (!validateWebhookSecret(request.url)) {
      console.warn('[AbacatePay Webhook] Invalid webhook secret')
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    // Read raw body for signature verification
    const rawBody = await request.text()

    // Layer 2: Validate HMAC-SHA256 signature
    const signature = request.headers.get('x-webhook-signature')
    if (!signature || !validateWebhookSignature(rawBody, signature)) {
      console.warn('[AbacatePay Webhook] Invalid HMAC signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(rawBody) as AbacateWebhookEvent

    console.log('[AbacatePay Webhook] Received event:', event.event)

    // Extract billing/checkout ID and purchase data based on event type
    let billingId: string
    let purchaseCode: string | undefined
    let customerEmail: string | null = null
    let customerName: string | null = null

    if (event.event === 'billing.paid') {
      // v1 format
      const billing = event.data.billing
      billingId = billing.id
      purchaseCode = billing.externalId
      customerEmail = billing.customer?.metadata?.email || null
      customerName = billing.customer?.metadata?.name || null
    } else if (event.event === 'checkout.completed') {
      // v2 format
      const checkout = event.data.checkout
      billingId = checkout.id
      purchaseCode = checkout.externalId
      customerEmail = event.data.customer?.email || null
      customerName = event.data.customer?.name || null
    } else {
      console.log(`[AbacatePay Webhook] Unhandled event type: ${(event as { event: string }).event}`)
      return NextResponse.json({ received: true })
    }

    // Idempotency check
    const webhookKey = `abacate:${event.event}:${billingId}`
    const existing = await prisma.webhookLog.findUnique({
      where: { eventKey: webhookKey },
    })

    if (existing) {
      console.log(`[AbacatePay Webhook] Duplicate webhook ignored: ${webhookKey}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    if (!purchaseCode) {
      console.warn('[AbacatePay Webhook] No externalId in payload')
      return NextResponse.json({ received: true })
    }

    console.log('[AbacatePay Webhook] Payment confirmed:', {
      purchaseCode,
      billingId,
      event: event.event,
    })

    await handlePaymentSuccess(purchaseCode, billingId, customerEmail, customerName)

    await prisma.webhookLog.create({
      data: {
        eventKey: webhookKey,
        event: event.event,
        paymentId: billingId,
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[AbacatePay Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(
  purchaseCode: string,
  checkoutId: string,
  customerEmail: string | null,
  customerName: string | null
) {
  const purchase = await prisma.purchase.findUnique({
    where: { code: purchaseCode },
    include: { user: true },
  })

  if (!purchase) {
    console.warn(`[AbacatePay Webhook] Purchase not found for code: ${purchaseCode}`)
    return
  }

  // Skip if already past PAID (processing or done)
  if (['PROCESSING', 'COMPLETED', 'REFUNDED'].includes(purchase.status)) {
    console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} already processed (${purchase.status})`)
    return
  }

  // Update to PAID (idempotent if already PAID from a previous retry)
  if (purchase.status === 'PENDING') {
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentProvider: 'abacatepay',
        paymentExternalId: checkoutId,
        buyerName: customerName || undefined,
      },
    })
  }

  // Capture email from checkout — update guest user with real email
  if (customerEmail && purchase.user.email.includes('@guest.eopix.app')) {
    const normalizedEmail = customerEmail.toLowerCase()
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      // User with this email already exists — link purchase to existing user
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { userId: existingUser.id },
      })
      console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} linked to existing user ${normalizedEmail}`)
    } else {
      // Update guest user email with real email from checkout
      await prisma.user.update({
        where: { id: purchase.userId },
        data: { email: normalizedEmail },
      })
      console.log(`[AbacatePay Webhook] Guest user updated with email: ${normalizedEmail}`)
    }
  }

  // Activate user account: move pending password hash from Purchase to User
  if (purchase.pendingPasswordHash && !purchase.user.passwordHash) {
    await prisma.user.update({
      where: { id: purchase.userId },
      data: { passwordHash: purchase.pendingPasswordHash },
    })
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { pendingPasswordHash: null },
    })
    console.log(`[AbacatePay Webhook] User account activated for ${purchaseCode}`)
  }

  console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} updated to PAID`)

  // Trigger Inngest job — re-throw on failure so webhook returns 500
  // and AbacatePay retries delivery. PAID purchases are not skipped above,
  // so retries will re-attempt the Inngest send.
  const { inngest } = await import('@/lib/inngest')
  await inngest.send({
    name: 'search/process',
    data: {
      purchaseId: purchase.id,
      purchaseCode: purchase.code,
      term: purchase.term,
      type: purchase.term.length === 11 ? 'CPF' : 'CNPJ',
      email: purchase.user.email,
    },
  })
  console.log(`[AbacatePay Webhook] Inngest job triggered for purchase ${purchaseCode}`)
}
