import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status && ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(status)) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { code: { contains: search.toUpperCase() } },
        { term: { contains: search.replace(/\D/g, '') } },
        { user: { email: { contains: search.toLowerCase() } } },
      ]
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { email: true },
          },
          searchResult: {
            select: { id: true },
          },
        },
      }),
      prisma.purchase.count({ where }),
    ])

    // Format response
    const formattedPurchases = purchases.map((p) => ({
      id: p.id,
      code: p.code,
      term: p.term.length === 11
        ? p.term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
        : p.term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**'),
      type: p.term.length === 11 ? 'CPF' : 'CNPJ',
      status: p.status,
      amount: p.amount,
      email: p.user.email,
      buyerName: p.buyerName,
      hasReport: !!p.searchResult,
      reportId: p.searchResult?.id || null,
      asaasPaymentId: p.asaasPaymentId,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    }))

    return NextResponse.json({
      purchases: formattedPurchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List purchases error:', error)
    return NextResponse.json(
      { error: 'Erro ao listar compras' },
      { status: 500 }
    )
  }
}
