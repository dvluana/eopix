import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { isMockMode } from '@/lib/mock-mode'
import { formatDocument } from '@/lib/validators'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // MOCK_MODE: serve mock reports without DB/auth
    if (isMockMode && id.startsWith('mock-report-')) {
      const { MOCK_REPORTS } = await import('@/lib/mocks/purchases-data')
      const mockReport = MOCK_REPORTS[id]
      if (mockReport) {
        return NextResponse.json(mockReport)
      }
      return NextResponse.json(
        { error: 'Mock report nao encontrado' },
        { status: 404 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID do relatorio obrigatorio' },
        { status: 400 }
      )
    }

    const session = await getSession(request)

    if (!session) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      )
    }

    // Find search result
    const searchResult = await prisma.searchResult.findUnique({
      where: { id },
      include: {
        purchases: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    })

    if (!searchResult) {
      return NextResponse.json(
        { error: 'Relatorio nao encontrado' },
        { status: 404 }
      )
    }

    // Check if user has access (owns a purchase linked to this result)
    const userHasAccess = searchResult.purchases.some(
      (p) => p.user.email.toLowerCase() === session.email.toLowerCase()
    )

    // Also allow admins
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
    const isAdmin = adminEmails.includes(session.email.toLowerCase())

    if (!userHasAccess && !isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Check expiration
    if (searchResult.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Relatorio expirado' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      id: searchResult.id,
      term: formatDocument(searchResult.term),
      type: searchResult.type,
      name: searchResult.name,
      data: searchResult.data,
      summary: searchResult.summary,
      createdAt: searchResult.createdAt,
      expiresAt: searchResult.expiresAt,
    })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar relatorio' },
      { status: 500 }
    )
  }
}
