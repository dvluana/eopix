import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDocument } from '@/lib/validators'

interface RouteParams {
  params: Promise<{ code: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.json(
        { error: 'Codigo obrigatorio' },
        { status: 400 }
      )
    }

    const purchase = await prisma.purchase.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        user: {
          select: { email: true },
        },
        searchResult: {
          select: { id: true },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra nao encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: purchase.code,
      term: formatDocument(purchase.term),
      type: purchase.term.length === 11 ? 'CPF' : 'CNPJ',
      status: purchase.status,
      processingStep: purchase.processingStep,
      email: purchase.user.email,
      amount: purchase.amount,
      createdAt: purchase.createdAt,
      paidAt: purchase.paidAt,
      hasReport: !!purchase.searchResult,
      reportId: purchase.searchResult?.id || null,
    })
  } catch (error) {
    console.error('Get purchase error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar compra' },
      { status: 500 }
    )
  }
}
