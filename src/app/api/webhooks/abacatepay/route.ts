import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhookSecret, validateWebhookSignature } from '@/lib/abacatepay'
import { sendPurchaseReceivedEmail } from '@/lib/email'

// AbacatePay webhook payload — supports both v2 checkout.completed and v1 billing.paid
// Note: As of 2026-03, AbacatePay v2 API still sends billing.paid webhooks (not checkout.completed)
interface AbacateWebhookEvent {
  event: string
  apiVersion?: number
  devMode?: boolean
  data: {
    // v2 format (checkout.completed)
    checkout?: {
      id: string
      externalId?: string
      url?: string
      amount: number
      paidAmount?: number
      status: string
      methods?: string[]
      customerId?: string
    }
    // v1 format (billing.paid) — still sent by v2 API
    billing?: {
      id: string
      amount: number
      status: string
      customer?: {
        id: string
        metadata?: {
          name?: string
          email?: string
          taxId?: string
          cellphone?: string
        }
      }
      products?: Array<{ publicId: string; externalId?: string; quantity: number }>
    }
    customer?: {
      id: string
      name?: string
      email?: string
      taxId?: string
    }
    payment?: {
      amount: number
      fee: number
      method: string
    }
    payerInformation?: {
      method: string
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('[AbacatePay Webhook] Request received:', {
    url: request.url,
    method: request.method,
    hasSignature: !!request.headers.get('x-webhook-signature'),
    contentType: request.headers.get('content-type'),
  })

  // Declared before try so purchaseCode is available in catch for Sentry context
  let purchaseCode: string | null = null

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

    // Layer 2: Validate HMAC-SHA256 signature (if present)
    const signature = request.headers.get('x-webhook-signature')
    if (signature && !validateWebhookSignature(rawBody, signature)) {
      console.warn('[AbacatePay Webhook] Invalid HMAC signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(rawBody) as AbacateWebhookEvent

    console.log('[AbacatePay Webhook] Event:', event.event, 'Data:', JSON.stringify(event.data).slice(0, 500))

    // Accept both checkout.completed (v2) and billing.paid (v1 — still sent by v2 API)
    const isPaymentEvent = event.event === 'checkout.completed' || event.event === 'billing.paid'
    if (!isPaymentEvent) {
      console.log(`[AbacatePay Webhook] Ignoring event: ${event.event}`)
      return NextResponse.json({ received: true })
    }

    // Extract checkoutId from either v2 (data.checkout) or v1 (data.billing) format
    const checkout = event.data.checkout
    const billing = event.data.billing
    const checkoutId = checkout?.id || billing?.id

    if (!checkoutId) {
      console.warn('[AbacatePay Webhook] No checkout/billing id in payload')
      return NextResponse.json({ received: true })
    }

    // Idempotency check — normalize key to avoid duplicates across event name changes
    const webhookKey = `abacate:payment:${checkoutId}`
    const existing = await prisma.webhookLog.findUnique({
      where: { eventKey: webhookKey },
    })

    if (existing) {
      console.log(`[AbacatePay Webhook] Duplicate ignored: ${webhookKey}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Primary: externalId from v2 checkout or lookup by checkoutId
    purchaseCode = checkout?.externalId || null

    if (!purchaseCode) {
      // Fallback: lookup by checkoutId stored in paymentExternalId
      const purchaseByCheckout = await prisma.purchase.findFirst({
        where: { paymentExternalId: checkoutId },
      })
      if (purchaseByCheckout) {
        purchaseCode = purchaseByCheckout.code
        console.log(`[AbacatePay Webhook] Found purchase ${purchaseCode} by checkoutId ${checkoutId}`)
      }
    } else {
      console.log(`[AbacatePay Webhook] Found purchase code via externalId: ${purchaseCode}`)
    }

    if (!purchaseCode) {
      console.warn('[AbacatePay Webhook] No purchase found for checkoutId:', checkoutId)
      return NextResponse.json({ received: true })
    }

    // Extract customer info from either format
    const customerEmail = event.data.customer?.email || billing?.customer?.metadata?.email || null
    const customerName = event.data.customer?.name || billing?.customer?.metadata?.name || null

    console.log('[AbacatePay Webhook] Payment confirmed:', { purchaseCode, checkoutId, customerEmail })

    await handlePaymentSuccess(purchaseCode, checkoutId, customerEmail, customerName)

    await prisma.webhookLog.create({
      data: { eventKey: webhookKey, event: event.event, paymentId: checkoutId },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[AbacatePay Webhook] Error:', error)
    // Capture to Sentry with purchase_code context when available (LGPD: never pass term/CPF/CNPJ)
    Sentry.withScope((scope) => {
      scope.setTag('error_category', 'pipeline')
      scope.setTag('purchase_code', purchaseCode ?? 'unknown')
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
    })
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
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { userId: existingUser.id },
      })
      console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} linked to existing user ${normalizedEmail}`)
    } else {
      await prisma.user.update({
        where: { id: purchase.userId },
        data: { email: normalizedEmail },
      })
      console.log(`[AbacatePay Webhook] Guest user updated with email: ${normalizedEmail}`)
    }
  }

  console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} updated to PAID`)

  // Enviar email "pedido recebido" — fire-and-forget
  // Usar customerEmail real se disponível, senão o email do user (se não for guest)
  const emailForNotification = (customerEmail && !customerEmail.includes('@guest.eopix.app'))
    ? customerEmail
    : (!purchase.user.email.includes('@guest.eopix.app') ? purchase.user.email : null)

  if (emailForNotification) {
    const nameForNotification = customerName || purchase.user.name || ''
    const formattedTerm = purchase.term.length === 11
      ? purchase.term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : purchase.term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')

    sendPurchaseReceivedEmail(
      emailForNotification,
      nameForNotification,
      purchase.code,
      formattedTerm,
      purchase.id
    ).catch(err => console.error('[Webhook] Purchase received email failed:', err))
  }

  // Trigger Inngest job — re-throw on failure so webhook returns 500
  // and AbacatePay retries delivery
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
