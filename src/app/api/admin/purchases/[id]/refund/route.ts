import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { sendPurchaseRefundedEmail } from '@/lib/email'

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

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { user: { select: { email: true, name: true } } },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra nao encontrada' },
        { status: 404 }
      )
    }

    if (!['PAID', 'PROCESSING', 'COMPLETED'].includes(purchase.status)) {
      return NextResponse.json(
        { error: 'Esta compra nao pode ser reembolsada' },
        { status: 400 }
      )
    }

    // Mark as REFUNDED in our DB
    await prisma.purchase.update({
      where: { id },
      data: { status: 'REFUNDED' },
    })

    // Fire-and-forget refunded email (skip guests)
    if (!purchase.user.email.includes('@guest.eopix.app')) {
      sendPurchaseRefundedEmail(
        purchase.user.email,
        purchase.user.name || '',
        purchase.code,
        purchase.id
      ).catch(err => console.error(`[Admin] Refunded email failed for ${purchase.code}:`, err))
    }

    // AbacatePay has no refund API — admin must process the actual payment in dashboard
    const externalId = purchase.paymentExternalId
    return NextResponse.json({
      success: true,
      message: `Compra marcada como reembolsada. Processe o pagamento pelo dashboard AbacatePay${externalId ? '. ID: ' + externalId : ''}.`,
    })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar reembolso' },
      { status: 500 }
    )
  }
}
