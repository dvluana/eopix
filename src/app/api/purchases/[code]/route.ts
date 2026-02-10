import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Mask document for response
    const maskedTerm = purchase.term.length === 11
      ? purchase.term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
      : purchase.term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**')

    // Mask email: m***@e***.com
    const emailParts = purchase.user.email.split('@')
    const maskedEmail = emailParts[0].charAt(0) + '***@' +
      emailParts[1].charAt(0) + '***.' +
      emailParts[1].split('.').pop()

    return NextResponse.json({
      code: purchase.code,
      term: maskedTerm,
      type: purchase.term.length === 11 ? 'CPF' : 'CNPJ',
      status: purchase.status,
      processingStep: purchase.processingStep,
      email: maskedEmail,
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
