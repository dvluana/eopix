import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { validateCanMarkPaidAndProcess } from '@/lib/purchase-workflow'

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
        { error: 'ID da compra obrigatório' },
        { status: 400 }
      )
    }

    // Find purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra não encontrada' },
        { status: 404 }
      )
    }

    const validation = validateCanMarkPaidAndProcess(purchase.status, !!purchase.searchResultId)
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    // Step 1: Mark as PAID
    await prisma.purchase.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    // Step 2: Trigger Inngest job to process search
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
    } catch (err) {
      console.error('Failed to trigger Inngest job:', err)
      // Keep as PAID so admin can retry processing
      await prisma.purchase.update({
        where: { id },
        data: {
          status: 'PAID',
          processingStep: 0,
        },
      })
      return NextResponse.json(
        { error: 'Falha ao disparar processamento' },
        { status: 500 }
      )
    }

    // Step 3: Update status to PROCESSING
    await prisma.purchase.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        processingStep: 1,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Compra marcada como paga e processamento iniciado',
    })
  } catch (error) {
    console.error('Mark paid and process error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar compra' },
      { status: 500 }
    )
  }
}
