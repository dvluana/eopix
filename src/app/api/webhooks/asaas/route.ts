import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhookToken } from '@/lib/asaas'

interface AsaasWebhookPayment {
  id: string
  status: string
  externalReference: string
  customer?: string
  value?: number
  payer?: {
    name?: string
    cpfCnpj?: string
  }
}

interface AsaasWebhookPayload {
  event: string
  payment: AsaasWebhookPayment
}

export async function POST(request: NextRequest) {
  try {
    // Validate webhook token
    const token = request.headers.get('asaas-access-token')

    if (!validateWebhookToken(token)) {
      console.warn('Invalid webhook token received')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as AsaasWebhookPayload
    const { event, payment } = body

    if (!payment?.id || !payment?.externalReference) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    // Idempotency check via database
    const webhookKey = `${event}:${payment.id}`

    const existing = await prisma.webhookLog.findUnique({
      where: { eventKey: webhookKey },
    })

    if (existing) {
      console.log(`Duplicate webhook ignored: ${webhookKey}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Find purchase by code (externalReference)
    const purchase = await prisma.purchase.findUnique({
      where: { code: payment.externalReference },
      include: { user: true },
    })

    if (!purchase) {
      console.warn(`Purchase not found for code: ${payment.externalReference}`)
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Map Asaas status to our status
    let newStatus: string | null = null
    let paidAt: Date | null = null

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        newStatus = 'PAID'
        paidAt = new Date()
        break

      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED':
      case 'PAYMENT_ANTICIPATED':
      case 'PAYMENT_AWAITING_RISK_ANALYSIS':
        // Keep as PENDING
        break

      case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS':
        newStatus = 'FAILED'
        break

      case 'PAYMENT_REFUNDED':
        newStatus = 'REFUNDED'
        break

      case 'PAYMENT_REFUND_IN_PROGRESS':
        // Keep current status
        break

      default:
        console.log(`Unhandled event: ${event}`)
    }

    if (newStatus) {
      const updateData: Record<string, unknown> = {
        status: newStatus,
      }

      if (paidAt) {
        updateData.paidAt = paidAt
      }

      // Store payer info if available
      if (payment.payer?.name) {
        updateData.buyerName = payment.payer.name
      }
      if (payment.payer?.cpfCnpj) {
        updateData.buyerCpfCnpj = payment.payer.cpfCnpj
      }

      // Update Asaas payment ID if not set
      if (!purchase.asaasPaymentId) {
        updateData.asaasPaymentId = payment.id
      }

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: updateData,
      })

      console.log(`Purchase ${purchase.code} updated to ${newStatus}`)

      // If payment confirmed, trigger Inngest job to process search
      if (newStatus === 'PAID') {
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
          console.log(`Inngest job triggered for purchase ${purchase.code}`)
        } catch (err) {
          console.error('Failed to trigger Inngest job:', err)
          // Don't fail the webhook - job can be retried
        }
      }
    }

    // Log webhook as processed
    await prisma.webhookLog.create({
      data: {
        eventKey: webhookKey,
        event,
        paymentId: payment.id,
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
