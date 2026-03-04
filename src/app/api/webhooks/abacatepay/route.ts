import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhookSecret, validateWebhookSignature } from '@/lib/abacatepay'

interface AbacateBillingPaidEvent {
  id: string
  event: 'billing.paid'
  devMode: boolean
  data: {
    payment: {
      amount: number
      fee: number
      method: string
    }
    billing: {
      id: string
      amount: number
      status: string
      frequency: string
      paidAmount: number
      products: { externalId: string; id: string; quantity: number }[]
      customer: {
        id: string
        metadata: {
          name?: string
          cellphone?: string
          email?: string
          taxId?: string
        }
      }
    }
  }
}

export async function POST(request: NextRequest) {
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

    const event = JSON.parse(rawBody) as AbacateBillingPaidEvent

    console.log('[AbacatePay Webhook] Received event:', event.event, event.id)

    // Idempotency check
    const webhookKey = `abacate:${event.event}:${event.id}`
    const existing = await prisma.webhookLog.findUnique({
      where: { eventKey: webhookKey },
    })

    if (existing) {
      console.log(`[AbacatePay Webhook] Duplicate webhook ignored: ${webhookKey}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    let processed = false

    if (event.event === 'billing.paid') {
      const billing = event.data.billing
      // externalId on the product is the purchase code
      const purchaseCode = billing.products[0]?.externalId

      if (!purchaseCode) {
        console.warn('[AbacatePay Webhook] No externalId in products')
        return NextResponse.json({ received: true })
      }

      console.log('[AbacatePay Webhook] Billing paid:', {
        purchaseCode,
        billingId: billing.id,
        amount: billing.paidAmount,
      })

      await handlePaymentSuccess(
        purchaseCode,
        billing.id,
        billing.customer?.metadata?.email || null,
        billing.customer?.metadata?.name || null
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
          paymentId: event.id,
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
  billingId: string,
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

  // Skip if already processed
  if (['PAID', 'PROCESSING', 'COMPLETED', 'REFUNDED'].includes(purchase.status)) {
    console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} already processed (${purchase.status})`)
    return
  }

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      paymentProvider: 'abacatepay',
      paymentExternalId: billingId,
      buyerName: customerName || undefined,
    },
  })

  console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} updated to PAID`)

  // Trigger Inngest job
  try {
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
  } catch (err) {
    console.error('[AbacatePay Webhook] Failed to trigger Inngest job:', err)
  }
}
