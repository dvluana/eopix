import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidCPF, isValidCNPJ, cleanDocument, formatDocument } from '@/lib/validators'
import { checkRateLimit } from '@/lib/rate-limit'
import { isBypassMode } from '@/lib/mock-mode'

interface ValidateRequest {
  document: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ValidateRequest
    const { document } = body

    if (!document) {
      return NextResponse.json(
        { error: 'Documento e obrigatorio' },
        { status: 400 }
      )
    }

    // Clean and validate document
    const cleanedDoc = cleanDocument(document)
    let docType: 'CPF' | 'CNPJ' | null = null

    if (cleanedDoc.length === 11 && isValidCPF(cleanedDoc)) {
      docType = 'CPF'
    } else if (cleanedDoc.length === 14 && isValidCNPJ(cleanedDoc)) {
      docType = 'CNPJ'
    }

    if (!docType) {
      return NextResponse.json(
        { error: 'Documento invalido' },
        { status: 400 }
      )
    }

    // Check rate limit by IP (bypassed in MOCK/TEST mode)
    if (!isBypassMode) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      const rateLimit = await checkRateLimit(ip, 'search')
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Limite de buscas excedido. Tente novamente mais tarde.' },
          { status: 429 }
        )
      }
    }

    // Check blocklist
    const blocked = await prisma.blocklist.findUnique({
      where: { term: cleanedDoc },
    })

    if (blocked) {
      return NextResponse.json(
        {
          blocked: true,
          reason: blocked.reason,
          message: 'Este documento nao pode ser consultado.',
        },
        { status: 403 }
      )
    }

    // Teaser (name) removed for performance - it's fetched again on the consultation page
    // This reduces validation time from 3-6s to ~300ms

    return NextResponse.json({
      valid: true,
      type: docType,
      term: cleanedDoc,
      formattedDocument: formatDocument(cleanedDoc),
    })
  } catch (error) {
    console.error('Validate error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
