import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidCPF, isValidCNPJ, cleanDocument } from '@/lib/validators'
import { requireAdmin } from '@/lib/auth'

interface AddBlocklistRequest {
  term: string
  associatedName?: string
  reason: 'SOLICITACAO_TITULAR' | 'JUDICIAL' | 'HOMONIMO'
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { term: { contains: cleanDocument(search) } },
            { associatedName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [blocklist, total] = await Promise.all([
      prisma.blocklist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blocklist.count({ where }),
    ])

    // Mask terms
    const maskedBlocklist = blocklist.map((b) => ({
      ...b,
      term: b.term.length === 11
        ? b.term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
        : b.term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**'),
    }))

    return NextResponse.json({
      blocklist: maskedBlocklist,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List blocklist error:', error)
    return NextResponse.json(
      { error: 'Erro ao listar blocklist' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json() as AddBlocklistRequest
    const { term, associatedName, reason } = body

    if (!term) {
      return NextResponse.json(
        { error: 'Documento obrigatorio' },
        { status: 400 }
      )
    }

    if (!reason || !['SOLICITACAO_TITULAR', 'JUDICIAL', 'HOMONIMO'].includes(reason)) {
      return NextResponse.json(
        { error: 'Motivo invalido' },
        { status: 400 }
      )
    }

    const cleanedTerm = cleanDocument(term)

    const isCpf = cleanedTerm.length === 11 && isValidCPF(cleanedTerm)
    const isCnpj = cleanedTerm.length === 14 && isValidCNPJ(cleanedTerm)

    if (!isCpf && !isCnpj) {
      return NextResponse.json(
        { error: 'Documento invalido' },
        { status: 400 }
      )
    }

    // Check if already blocked
    const existing = await prisma.blocklist.findUnique({
      where: { term: cleanedTerm },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Documento ja esta na blocklist' },
        { status: 409 }
      )
    }

    // Add to blocklist
    const blocked = await prisma.blocklist.create({
      data: {
        term: cleanedTerm,
        associatedName: associatedName || null,
        reason,
      },
    })

    return NextResponse.json({
      id: blocked.id,
      term: cleanedTerm.length === 11
        ? cleanedTerm.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
        : cleanedTerm.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**'),
      reason: blocked.reason,
      createdAt: blocked.createdAt,
    })
  } catch (error) {
    console.error('Add blocklist error:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar a blocklist' },
      { status: 500 }
    )
  }
}
