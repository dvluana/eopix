import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidCPF, isValidCNPJ, cleanDocument, formatDocument } from '@/lib/validators'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

const addBlocklistSchema = z.object({
  term: z.string().min(1, 'Documento obrigatorio'),
  associatedName: z.string().optional(),
  reason: z.enum(['SOLICITACAO_TITULAR', 'JUDICIAL', 'HOMONIMO'], {
    error: 'Motivo invalido',
  }),
})

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
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

    const formattedBlocklist = blocklist.map((b) => ({
      ...b,
      term: formatDocument(b.term),
    }))

    return NextResponse.json({
      blocklist: formattedBlocklist,
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
    const body = await request.json()
    const parsed = addBlocklistSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Dados invalidos'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const { term, associatedName, reason } = parsed.data

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
      term: formatDocument(cleanedTerm),
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
