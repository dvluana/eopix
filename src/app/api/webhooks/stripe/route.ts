import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { validateWebhookSignature } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const payload = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.warn('[Stripe Webhook] Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Validate webhook signature
    let event: Stripe.Event
    try {
      event = validateWebhookSignature(payload, signature)
    } catch (err) {
      console.error('[Stripe Webhook] Invalid signature:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log('[Stripe Webhook] Received event:', event.type, event.id)

    // Idempotency check via database
    const webhookKey = `${event.type}:${event.id}`
    const existing = await prisma.webhookLog.findUnique({
      where: { eventKey: webhookKey },
    })

    if (existing) {
      console.log(`[Stripe Webhook] Duplicate webhook ignored: ${webhookKey}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Handle different event types
    let processed = false

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get external reference (purchase code)
        const purchaseCode = session.client_reference_id
        if (!purchaseCode) {
          console.warn('[Stripe Webhook] No client_reference_id in session')
          break
        }

        // Check payment status
        const paymentStatus = session.payment_status
        console.log('[Stripe Webhook] Session completed:', {
          purchaseCode,
          paymentStatus,
          paymentIntentId: session.payment_intent,
        })

        // If payment is already complete (card payment), mark as PAID
        if (paymentStatus === 'paid') {
          await handlePaymentSuccess(
            purchaseCode,
            session.payment_intent as string,
            session.customer_details?.email || null,
            session.customer_details?.name || null
          )
          processed = true
        }
        // If unpaid (Pix), wait for async_payment_succeeded
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        // Pix payment completed
        const session = event.data.object as Stripe.Checkout.Session
        const purchaseCode = session.client_reference_id

        if (!purchaseCode) {
          console.warn('[Stripe Webhook] No client_reference_id in async_payment_succeeded')
          break
        }

        console.log('[Stripe Webhook] Async payment succeeded (Pix):', purchaseCode)

        await handlePaymentSuccess(
          purchaseCode,
          session.payment_intent as string,
          session.customer_details?.email || null,
          session.customer_details?.name || null
        )
        processed = true
        break
      }

      case 'checkout.session.async_payment_failed': {
        // Pix payment failed/expired
        const session = event.data.object as Stripe.Checkout.Session
        const purchaseCode = session.client_reference_id

        if (!purchaseCode) {
          console.warn('[Stripe Webhook] No client_reference_id in async_payment_failed')
          break
        }

        console.log('[Stripe Webhook] Async payment failed (Pix expired):', purchaseCode)

        await handlePaymentFailed(purchaseCode)
        processed = true
        break
      }

      case 'charge.refunded': {
        // Handle refund event
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (!paymentIntentId) {
          console.warn('[Stripe Webhook] No payment_intent in charge.refunded')
          break
        }

        console.log('[Stripe Webhook] Charge refunded:', paymentIntentId)

        // Find purchase by payment intent
        const purchase = await prisma.purchase.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        })

        if (purchase && purchase.status !== 'REFUNDED') {
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              status: 'REFUNDED',
              refundReason: 'STRIPE_WEBHOOK',
              refundDetails: JSON.stringify({
                source: 'webhook',
                chargeId: charge.id,
                timestamp: new Date().toISOString(),
              }),
            },
          })
          console.log(`[Stripe Webhook] Purchase ${purchase.code} marked as REFUNDED`)
        }
        processed = true
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    // Log webhook as processed
    if (processed) {
      await prisma.webhookLog.create({
        data: {
          eventKey: webhookKey,
          event: event.type,
          paymentId: event.id,
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(
  purchaseCode: string,
  paymentIntentId: string,
  customerEmail: string | null,
  customerName: string | null
) {
  // Find purchase by code
  const purchase = await prisma.purchase.findUnique({
    where: { code: purchaseCode },
    include: { user: true },
  })

  if (!purchase) {
    console.warn(`[Stripe Webhook] Purchase not found for code: ${purchaseCode}`)
    return
  }

  // Skip if already processed
  if (['PAID', 'PROCESSING', 'COMPLETED', 'REFUNDED'].includes(purchase.status)) {
    console.log(`[Stripe Webhook] Purchase ${purchaseCode} already processed (${purchase.status})`)
    return
  }

  // Update purchase
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId,
      buyerName: customerName || undefined,
    },
  })

  console.log(`[Stripe Webhook] Purchase ${purchaseCode} updated to PAID`)

  // Trigger Inngest job to process search
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
    console.log(`[Stripe Webhook] Inngest job triggered for purchase ${purchaseCode}`)
  } catch (err) {
    console.error('[Stripe Webhook] Failed to trigger Inngest job:', err)
    // Don't fail the webhook - job can be retried
  }
}

async function handlePaymentFailed(purchaseCode: string) {
  // Find purchase by code
  const purchase = await prisma.purchase.findUnique({
    where: { code: purchaseCode },
  })

  if (!purchase) {
    console.warn(`[Stripe Webhook] Purchase not found for code: ${purchaseCode}`)
    return
  }

  // Skip if already in a final state
  if (['PAID', 'PROCESSING', 'COMPLETED', 'REFUNDED', 'FAILED'].includes(purchase.status)) {
    console.log(`[Stripe Webhook] Purchase ${purchaseCode} already in final state (${purchase.status})`)
    return
  }

  // Update purchase to FAILED
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      status: 'FAILED',
      failureReason: 'PAYMENT_FAILED',
      failureDetails: JSON.stringify({
        reason: 'Pix payment expired or failed',
        timestamp: new Date().toISOString(),
      }),
    },
  })

  console.log(`[Stripe Webhook] Purchase ${purchaseCode} marked as FAILED`)
}
