import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refundPayment } from '@/lib/asaas'
import { requireAdmin } from '@/lib/auth'

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

    if (!purchase.asaasPaymentId) {
      return NextResponse.json(
        { error: 'Pagamento nao encontrado no Asaas' },
        { status: 400 }
      )
    }

    // Attempt refund
    const refundResult = await refundPayment(purchase.asaasPaymentId)

    if (!refundResult.success) {
      // Update status to REFUND_FAILED
      await prisma.purchase.update({
        where: { id },
        data: { status: 'REFUND_FAILED' },
      })

      return NextResponse.json(
        { error: 'Falha ao processar reembolso' },
        { status: 500 }
      )
    }

    // Update status to REFUNDED
    await prisma.purchase.update({
      where: { id },
      data: { status: 'REFUNDED' },
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
