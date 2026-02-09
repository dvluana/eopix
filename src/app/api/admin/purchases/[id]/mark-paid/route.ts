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

    // Find purchase with user
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra nao encontrada' },
        { status: 404 }
      )
    }

    // Only allow marking PENDING purchases as paid
    if (purchase.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Apenas compras pendentes podem ser marcadas como pagas' },
        { status: 400 }
      )
    }

    // Update to PAID
    await prisma.purchase.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    // Compra marcada como paga - processamento será feito via botão "Processar" separado
    console.log(`Purchase ${purchase.code} marked as PAID - awaiting manual processing`)

    return NextResponse.json({
      success: true,
      message: 'Compra marcada como paga. Use o botao Processar para gerar o relatorio.',
    })
  } catch (error) {
    console.error('Mark paid error:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar compra como paga' },
      { status: 500 }
    )
  }
}
