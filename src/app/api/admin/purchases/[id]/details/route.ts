import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { PROCESSING_STEPS } from '@/types/domain'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { user: { select: { email: true, name: true } } },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
    }

    // Calcular status de cada step baseado em processingStep atual
    const currentStep = purchase.processingStep || 0
    const processingLogs = PROCESSING_STEPS.map(({ step, label }) => ({
      step,
      label,
      status: step < currentStep ? 'completed'
            : step === currentStep && purchase.status === 'PROCESSING' ? 'in_progress'
            : 'pending',
    }))

    return NextResponse.json({
      purchase: {
        id: purchase.id,
        code: purchase.code,
        term: purchase.term,
        type: purchase.term.length === 11 ? 'CPF' : 'CNPJ',
        status: purchase.status,
        processingStep: purchase.processingStep,
        amount: purchase.amount,
        email: purchase.user.email,
        buyerName: purchase.buyerName,
        hasReport: !!purchase.searchResultId,
        reportId: purchase.searchResultId,
        failureReason: purchase.failureReason,
        failureDetails: purchase.failureDetails,
        refundReason: purchase.refundReason,
        refundDetails: purchase.refundDetails,
        createdAt: purchase.createdAt,
        paidAt: purchase.paidAt,
      },
      processingLogs,
    })
  } catch (error) {
    console.error('Get purchase details error:', error)
    return NextResponse.json({ error: 'Erro ao buscar detalhes' }, { status: 500 })
  }
}
