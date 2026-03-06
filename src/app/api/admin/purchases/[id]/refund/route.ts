import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    const purchase = await prisma.purchase.findUnique({
      where: { id },
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

    // AbacatePay has no refund API — admin must use dashboard directly
    const externalId = purchase.paymentExternalId
    return NextResponse.json(
      { error: `Reembolso deve ser feito pelo dashboard AbacatePay${externalId ? '. ID: ' + externalId : ''}` },
      { status: 400 }
    )
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar reembolso' },
      { status: 500 }
    )
  }
}
