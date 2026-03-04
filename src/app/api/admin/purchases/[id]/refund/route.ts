import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processRefund, getProviderDisplayName } from '@/lib/payment'
import { requireAdmin } from '@/lib/auth'
import type { PaymentProvider } from '@/lib/payment'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID da compra obrigatorio' },
        { status: 400 }
      )
    }

    // Find purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra nao encontrada' },
        { status: 404 }
      )
    }

    // Check if refundable
    if (!['PAID', 'PROCESSING', 'COMPLETED'].includes(purchase.status)) {
      return NextResponse.json(
        { error: 'Esta compra nao pode ser reembolsada' },
        { status: 400 }
      )
    }

    const provider = (purchase.paymentProvider || 'stripe') as PaymentProvider
    const externalId = purchase.paymentExternalId || purchase.stripePaymentIntentId

    if (!externalId) {
      return NextResponse.json(
        { error: `Pagamento nao encontrado no ${getProviderDisplayName(provider)}` },
        { status: 400 }
      )
    }

    // AbacatePay: no refund API, must use dashboard
    if (provider === 'abacatepay') {
      return NextResponse.json(
        { error: 'Reembolso deve ser feito pelo dashboard AbacatePay. ID: ' + externalId },
        { status: 400 }
      )
    }

    // Stripe: process refund via API
    const refundResult = await processRefund(externalId, provider)

    if (!refundResult.success) {
      await prisma.purchase.update({
        where: { id },
        data: {
          status: 'REFUND_FAILED',
          failureDetails: JSON.stringify({
            reason: 'Manual refund failed',
            refundedBy: 'admin',
            timestamp: new Date().toISOString(),
          }),
        },
      })

      return NextResponse.json(
        { error: 'Falha ao processar reembolso' },
        { status: 500 }
      )
    }

    await prisma.purchase.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        refundReason: 'MANUAL_ADMIN',
        refundDetails: JSON.stringify({
          refundedBy: 'admin',
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      refundId: refundResult.refundId,
      message: 'Reembolso processado com sucesso',
    })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar reembolso' },
      { status: 500 }
    )
  }
}
