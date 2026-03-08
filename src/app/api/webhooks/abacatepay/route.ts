import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhookSecret, validateWebhookSignature } from '@/lib/abacatepay'

// v1 billing.paid payload (per official AbacatePay docs)
// data is flat — NOT nested under data.billing
interface AbacateWebhookEvent {
  event: string
  devMode: boolean
  data: {
    id: string
    externalId?: string
    amount: number
    paidAmount?: number
    status: string
    customer?: {
      id: string
      email?: string
      name?: string
      cellphone?: string
      taxId?: string
      // v1 may also nest under metadata
      metadata?: {
        name?: string
        email?: string
        cellphone?: string
        taxId?: string
      }
    }
    createdAt?: string
    updatedAt?: string
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

    if (event.event !== 'billing.paid') {
      console.log(`[AbacatePay Webhook] Ignoring event: ${event.event}`)
      return NextResponse.json({ received: true })
    }

    // Extract fields from flat v1 payload
    const billingId = event.data.id
    const purchaseCode = event.data.externalId
    const customer = event.data.customer
    // Customer email/name: try root level first, then metadata (v1 compat)
    const customerEmail = customer?.email || customer?.metadata?.email || null
    const customerName = customer?.name || customer?.metadata?.name || null

    // Idempotency check
    const webhookKey = `abacate:${event.event}:${billingId}`
    const existing = await prisma.webhookLog.findUnique({
      where: { eventKey: webhookKey },
    })

    if (existing) {
      console.log(`[AbacatePay Webhook] Duplicate ignored: ${webhookKey}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    if (!purchaseCode) {
      console.warn('[AbacatePay Webhook] No externalId in payload')
      return NextResponse.json({ received: true })
    }

    console.log('[AbacatePay Webhook] Payment confirmed:', {
      purchaseCode,
      billingId,
      customerEmail,
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
