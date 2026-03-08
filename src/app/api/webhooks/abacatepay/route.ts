import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhookSecret, validateWebhookSignature } from '@/lib/abacatepay'

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
      taxId: string // masked: "123.***.***-**"
    } | null
  }
}

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

    const event = JSON.parse(rawBody) as AbacateCheckoutCompletedEvent

    console.log('[AbacatePay Webhook] Received event:', event.event)

    // Idempotency check — use checkout.id since v2 has no top-level id
    const checkout = event.data.checkout
    const webhookKey = `abacate:checkout.completed:${checkout.id}`
    const existing = await prisma.webhookLog.findUnique({
      where: { eventKey: webhookKey },
    })

    if (existing) {
      console.log(`[AbacatePay Webhook] Duplicate webhook ignored: ${webhookKey}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    let processed = false

    if (event.event === 'checkout.completed') {
      const purchaseCode = checkout.externalId

      if (!purchaseCode) {
        console.warn('[AbacatePay Webhook] No externalId in checkout')
        return NextResponse.json({ received: true })
      }

      console.log('[AbacatePay Webhook] Checkout completed:', {
        purchaseCode,
        checkoutId: checkout.id,
        amount: checkout.paidAmount,
      })

      await handlePaymentSuccess(
        purchaseCode,
        checkout.id,
        event.data.customer?.email || null,
        event.data.customer?.name || null
      )
      processed = true
    } else {
      console.log(`[AbacatePay Webhook] Unhandled event type: ${event.event}`)
    }

    if (processed) {
      await prisma.webhookLog.create({
        data: {
          eventKey: webhookKey,
          event: event.event,
          paymentId: checkout.id,
        },
      })
    }

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
