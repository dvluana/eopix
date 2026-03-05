import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { prisma } from '@/lib/prisma'
import { createCheckout, getPaymentProvider } from '@/lib/payment'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidCPF, isValidCNPJ, isValidEmail, cleanDocument, formatDocument } from '@/lib/validators'
import { isBypassMode, isBypassPayment } from '@/lib/mock-mode'

interface CreatePurchaseRequest {
  term: string
  email?: string
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
    if (!term || !termsAccepted) {
      return NextResponse.json(
        { error: 'term e termsAccepted sao obrigatorios' },
        { status: 400 }
      )
    }

    if (email && !isValidEmail(email)) {
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

    // Check rate limit by IP (bypass in MOCK_MODE/TEST_MODE and dev)
    const isDev = process.env.NODE_ENV === 'development'
    if (!isBypassMode && !isDev) {
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

    // Check for existing active report for same document (logged-in users only)
    const session = await getSession()
    if (session) {
      const sessionUser = await prisma.user.findUnique({
        where: { email: session.email },
      })
      if (sessionUser) {
        const existingPurchase = await prisma.purchase.findFirst({
          where: {
            userId: sessionUser.id,
            term: cleanedTerm,
            status: 'COMPLETED',
            searchResult: {
              expiresAt: { gt: new Date() }
            }
          },
          include: { searchResult: { select: { id: true, expiresAt: true } } }
        })

        if (existingPurchase) {
          return NextResponse.json({
            error: 'Voce ja possui um relatorio ativo para este documento.',
            existingReportId: existingPurchase.searchResult?.id,
            expiresAt: existingPurchase.searchResult?.expiresAt,
          }, { status: 409 })
        }
      }
    }

    // Generate unique code (before user lookup so we can use it for guest email)
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

    // Get user from session (if authenticated) or create guest
    const userEmail = session?.email || (email ? email.toLowerCase() : `guest-${code.toLowerCase()}@guest.eopix.app`)
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { email: userEmail },
      })
    }

    // Get price from env
    const priceCents = parseInt(process.env.PRICE_CENTS || '2990', 10)

    // Auto-fallback: bypass se API key não configurada (dev sem MOCK_MODE)
    const effectiveBypass = isBypassPayment || !process.env.ABACATEPAY_API_KEY
    if (effectiveBypass && !isBypassPayment) {
      console.warn('[Purchases] ABACATEPAY_API_KEY nao configurado — bypass automatico')
    }

    // Bypass payment: cria purchase PENDING aguardando ação manual do admin (sem checkout)
    if (effectiveBypass) {
      console.log(`🧪 [BYPASS] Payment bypass - criando purchase PENDING para: ${cleanedTerm}`)

      // Cria purchase com status PENDING - aguarda ação manual do admin
      const purchase = await prisma.purchase.create({
        data: {
          userId: user.id,
          code,
          term: cleanedTerm,
          amount: priceCents,
          status: 'PENDING',
          paymentProvider: getPaymentProvider(),
          termsAcceptedAt: new Date(),
        },
      })

      console.log(`🧪 [BYPASS] Purchase criada PENDING: ${purchase.code} (${getPaymentProvider()}) - aguardando ação manual no admin`)

      // Retorna URL de confirmação direto (sem checkout externo)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.json({
        code: purchase.code,
        checkoutUrl: `${appUrl}/compra/confirmacao?code=${purchase.code}`,
        _bypassMode: true,
      })
    }

    // Fluxo normal: cria purchase PENDING e checkout via provider
    const provider = getPaymentProvider()
    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        code,
        term: cleanedTerm,
        amount: priceCents,
        status: 'PENDING',
        paymentProvider: provider,
        termsAcceptedAt: new Date(),
      },
    })

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const { sessionId, checkoutUrl } = await createCheckout({
        email: userEmail,
        name: user.name || undefined,
        externalRef: code,
        successUrl: `${appUrl}/compra/confirmacao?code=${code}`,
        cancelUrl: `${appUrl}/compra/confirmacao?code=${code}&cancelled=true`,
      })

      console.log(`[${provider}] Checkout session created:`, { code, sessionId })

      return NextResponse.json({
        code: purchase.code,
        checkoutUrl,
      })
    } catch (checkoutError) {
      Sentry.captureException(checkoutError, {
        tags: { service: provider, operation: 'createCheckout' },
        extra: { code, term: cleanedTerm, email },
      })
      console.error(`[${provider}] Error:`, checkoutError)
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
      term: formatDocument(p.term),
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
