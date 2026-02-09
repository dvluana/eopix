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

    // Trigger Inngest job to process the report
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
      console.log(`Inngest job triggered for purchase ${purchase.code} (manual mark-paid)`)
    } catch (err) {
      console.error('Failed to trigger Inngest job:', err)
      return NextResponse.json(
        { error: 'Compra marcada como paga, mas falha ao iniciar processamento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Compra marcada como paga e processamento iniciado',
    })
  } catch (error) {
    console.error('Mark paid error:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar compra como paga' },
      { status: 500 }
    )
  }
}
