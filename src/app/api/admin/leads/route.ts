import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const reason = searchParams.get('reason') || ''

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (reason && ['API_DOWN', 'MAINTENANCE'].includes(reason)) {
      where.reason = reason
    }

    const [leads, total] = await Promise.all([
      prisma.leadCapture.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.leadCapture.count({ where }),
    ])

    // Format response - mask terms if present
    const formattedLeads = leads.map((l) => ({
      id: l.id,
      email: l.email,
      term: l.term
        ? l.term.length === 11
          ? l.term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
          : l.term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**')
        : null,
      reason: l.reason,
      createdAt: l.createdAt,
    }))

    return NextResponse.json({
      leads: formattedLeads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List leads error:', error)
    return NextResponse.json(
      { error: 'Erro ao listar leads' },
      { status: 500 }
    )
  }
}
