import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTurnstile } from '@/lib/turnstile'
import { isValidCPF, isValidCNPJ, cleanDocument } from '@/lib/validators'
import { checkRateLimit } from '@/lib/rate-limit'
import { consultCpf } from '@/lib/apifull'
import { consultCnpj as consultCnpjBrasilApi } from '@/lib/brasilapi'

interface ValidateRequest {
  document: string
  turnstileToken: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ValidateRequest
    const { document, turnstileToken } = body

    if (!document || !turnstileToken) {
      return NextResponse.json(
        { error: 'Documento e token Turnstile sao obrigatorios' },
        { status: 400 }
      )
    }

    // Verify Turnstile
    const turnstileValid = await verifyTurnstile(turnstileToken)
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Verificacao de seguranca falhou' },
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

    // Check rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimit = await checkRateLimit(ip, 'search')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Limite de buscas excedido. Tente novamente mais tarde.' },
        { status: 429 }
      )
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

    // Fetch teaser data (name only for display)
    let name = ''
    try {
      if (docType === 'CPF') {
        const cpfData = await consultCpf(cleanedDoc)
        name = cpfData.name
      } else {
        const cnpjData = await consultCnpjBrasilApi(cleanedDoc)
        name = cnpjData.razaoSocial
      }
    } catch (err) {
      console.error('Error fetching teaser data:', err)
      // Continue without name - will show masked document only
    }

    return NextResponse.json({
      valid: true,
      type: docType,
      term: cleanedDoc,
      name: name || null,
      // Mask for display: 123.456.***-** or 12.345.678/****-**
      maskedDocument: docType === 'CPF'
        ? cleanedDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
        : cleanedDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**'),
    })
  } catch (error) {
    console.error('Validate error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
