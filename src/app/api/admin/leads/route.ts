import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatDocument } from '@/lib/validators'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const reason = searchParams.get('reason') || ''

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (reason) {
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
      term: l.term ? formatDocument(l.term) : null,
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
