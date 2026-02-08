import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhookToken } from '@/lib/asaas'
import { isMockMode } from '@/lib/mock-mode'

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

// Idempotency: track processed webhooks
const processedWebhooks = new Set<string>()

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

    // Idempotency check
    const webhookKey = `${event}:${payment.id}`
    if (processedWebhooks.has(webhookKey)) {
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

      // If payment confirmed, trigger background job to process search
      if (newStatus === 'PAID') {
        // In mock mode, we'll simulate the job inline or just log
        if (isMockMode) {
          console.log(`[MOCK] Would trigger process-search job for purchase ${purchase.code}`)

          // Auto-complete in mock mode after a delay
          setTimeout(async () => {
            try {
              await prisma.purchase.update({
                where: { id: purchase.id },
                data: { status: 'PROCESSING' },
              })
              console.log(`[MOCK] Purchase ${purchase.code} set to PROCESSING`)

              // Simulate processing delay
              setTimeout(async () => {
                try {
                  // Create mock search result
                  const searchResult = await prisma.searchResult.create({
                    data: {
                      term: purchase.term,
                      type: purchase.term.length === 11 ? 'CPF' : 'CNPJ',
                      name: 'Nome Mock Teste',
                      data: {
                        mock: true,
                        scenario: parseInt(purchase.term.slice(-1)) < 5 ? 'chuva' : 'sol',
                      },
                      summary: 'Este e um resumo de teste em modo mock.',
                      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                  })

                  await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                      status: 'COMPLETED',
                      searchResultId: searchResult.id,
                    },
                  })

                  console.log(`[MOCK] Purchase ${purchase.code} COMPLETED with result ${searchResult.id}`)
                } catch (err) {
                  console.error('[MOCK] Error completing purchase:', err)
                }
              }, 3000)
            } catch (err) {
              console.error('[MOCK] Error setting PROCESSING:', err)
            }
          }, 1000)
        } else {
          // In production, trigger Inngest job
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
    }

    // Mark as processed
    processedWebhooks.add(webhookKey)

    // Cleanup old entries (keep last 1000)
    if (processedWebhooks.size > 1000) {
      const entries = Array.from(processedWebhooks)
      entries.slice(0, entries.length - 1000).forEach((key) => {
        processedWebhooks.delete(key)
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
