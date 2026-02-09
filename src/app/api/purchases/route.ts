import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { prisma } from '@/lib/prisma'
import { createPixCharge } from '@/lib/asaas'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidCPF, isValidCNPJ, isValidEmail, cleanDocument } from '@/lib/validators'
import { isBypassMode } from '@/lib/mock-mode'

interface CreatePurchaseRequest {
  term: string
  email: string
  termsAccepted: boolean
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreatePurchaseRequest
    const { term, email, termsAccepted } = body

    // Validate inputs
    if (!term || !email || !termsAccepted) {
      return NextResponse.json(
        { error: 'term, email e termsAccepted sao obrigatorios' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalido' },
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

    // Check rate limit by IP (bypass in MOCK_MODE/TEST_MODE)
    if (!isBypassMode) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      const rateLimit = await checkRateLimit(ip, 'purchase')
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Limite de compras excedido. Tente novamente mais tarde.' },
          { status: 429 }
        )
      }
    }

    // Check blocklist
    const blocked = await prisma.blocklist.findUnique({
      where: { term: cleanedTerm },
    })

    if (blocked) {
      return NextResponse.json(
        { error: 'Este documento nao pode ser consultado' },
        { status: 403 }
      )
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { email: email.toLowerCase() },
      })
    }

    // Generate unique code
    let code = generateCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.purchase.findUnique({
        where: { code },
      })
      if (!existing) break
      code = generateCode()
      attempts++
    }

    // Get price from env
    const priceCents = parseInt(process.env.PRICE_CENTS || '2990', 10)

    // Bypass mode: cria purchase PENDING aguardando ação manual do admin (sem Asaas)
    if (isBypassMode) {
      console.log(`🧪 [BYPASS] Asaas bypass - criando purchase PENDING para: ${cleanedTerm}`)

      // Cria purchase com status PENDING - aguarda ação manual do admin
      const purchase = await prisma.purchase.create({
        data: {
          userId: user.id,
          code,
          term: cleanedTerm,
          amount: priceCents,
          status: 'PENDING',
          termsAcceptedAt: new Date(),
        },
      })

      console.log(`🧪 [BYPASS] Purchase criada PENDING: ${purchase.code} - aguardando ação manual no admin`)

      // Retorna URL de confirmação direto (sem checkout Asaas)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.json({
        code: purchase.code,
        checkoutUrl: `${appUrl}/compra/confirmacao?code=${purchase.code}`,
        _bypassMode: true,
      })
    }

    // Fluxo normal: cria purchase PENDING e checkout Asaas
    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        code,
        term: cleanedTerm,
        amount: priceCents,
        status: 'PENDING',
        termsAcceptedAt: new Date(),
      },
    })

    // Create Asaas checkout (usando paymentLinks)
    try {
      const { paymentId, checkoutUrl } = await createPixCharge({
        amount: priceCents,
        email,
        externalRef: code,
        description: `Consulta E o Pix - ${isCpf ? 'CPF' : 'CNPJ'}`,
      })

      // Update purchase with Asaas payment ID
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { asaasPaymentId: paymentId },
      })

      return NextResponse.json({
        code: purchase.code,
        checkoutUrl,
      })
    } catch (asaasError) {
      Sentry.captureException(asaasError, {
        tags: { service: 'asaas', operation: 'createPixCharge' },
        extra: { code, term: cleanedTerm, email },
      })
      console.error('[Asaas] Error:', asaasError)
      // Deletar purchase órfã (sem pagamento associado)
      await prisma.purchase.delete({ where: { id: purchase.id } })
      return NextResponse.json(
        { error: 'Erro ao criar pagamento. Tente novamente.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Create purchase error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar compra' },
      { status: 500 }
    )
  }
}

// GET: List purchases for authenticated user
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            code: true,
            term: true,
            status: true,
            processingStep: true,
            createdAt: true,
            paidAt: true,
            searchResultId: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ purchases: [] })
    }

    // Map purchases with additional info
    const purchases = user.purchases.map((p) => ({
      id: p.id,
      code: p.code,
      status: p.status,
      processingStep: p.processingStep,
      type: p.term.length === 11 ? 'CPF' : 'CNPJ',
      term: p.term.length === 11
        ? p.term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
        : p.term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**'),
      createdAt: p.createdAt,
      hasReport: !!p.searchResultId,
      reportId: p.searchResultId,
    }))

    return NextResponse.json({
      email: session.email,
      purchases,
    })
  } catch (error) {
    console.error('List purchases error:', error)
    return NextResponse.json(
      { error: 'Erro ao listar compras' },
      { status: 500 }
    )
  }
}
