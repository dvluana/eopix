import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { prisma } from '@/lib/prisma'
import { createCheckout, getPaymentProvider } from '@/lib/payment'
import { createOrGetCustomer } from '@/lib/abacatepay'
import { getSession, isAdminEmail } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidCPF, isValidCNPJ, isValidEmail, cleanDocument, formatDocument } from '@/lib/validators'
import { isBypassMode, isBypassPayment, isMockMode } from '@/lib/mock-mode'
import { inngest } from '@/lib/inngest'

interface CreatePurchaseRequest {
  term: string
  email?: string
  name?: string
  cellphone?: string
  buyerTaxId?: string
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
    const { term, email, name, cellphone, buyerTaxId, termsAccepted } = body

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

    // Require authentication in live mode (bypass allowed in MOCK/TEST/dev)
    const session = await getSession()
    if (!session && !isBypassMode && !isDev) {
      return NextResponse.json(
        { error: 'Autenticacao necessaria. Faca login ou crie uma conta.' },
        { status: 401 }
      )
    }

    // Check for existing active report or pending purchase for same document (logged-in users only)
    if (session) {
      const sessionUser = await prisma.user.findUnique({
        where: { email: session.email },
      })
      if (sessionUser) {
        // Block if user already has a completed report that hasn't expired
        const existingCompleted = await prisma.purchase.findFirst({
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

        if (existingCompleted) {
          return NextResponse.json({
            error: 'Voce ja possui um relatorio ativo para este documento.',
            existingReportId: existingCompleted.searchResult?.id,
            expiresAt: existingCompleted.searchResult?.expiresAt,
          }, { status: 409 })
        }

        // Reuse recent PENDING purchase (<30 min) instead of creating duplicate
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
        const existingPending = await prisma.purchase.findFirst({
          where: {
            userId: sessionUser.id,
            term: cleanedTerm,
            status: 'PENDING',
            createdAt: { gt: thirtyMinAgo },
          },
          orderBy: { createdAt: 'desc' },
        })

        if (existingPending && existingPending.paymentExternalId) {
          // Busca URL da billing existente via API (paymentExternalId agora guarda billingId)
          const apiKey = process.env.ABACATEPAY_API_KEY
          if (apiKey) {
            const billingRes = await fetch(
              `https://api.abacatepay.com/v2/checkouts/get?id=${existingPending.paymentExternalId}`,
              { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } }
            )
            if (billingRes.ok) {
              const billingData = await billingRes.json()
              const checkoutUrl = billingData?.data?.url
              if (checkoutUrl) {
                return NextResponse.json({ code: existingPending.code, checkoutUrl })
              }
            }
          }
          // Se não conseguir recuperar URL, cria nova billing abaixo
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
        data: {
          email: userEmail,
          ...(name ? { name } : {}),
          ...(cellphone ? { cellphone } : {}),
          ...(buyerTaxId ? { taxId: buyerTaxId } : {}),
        },
      })
    } else if (name || cellphone || buyerTaxId) {
      // Update user with new data if provided
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name && !user.name ? { name } : {}),
          ...(cellphone ? { cellphone } : {}),
          ...(buyerTaxId && !user.taxId ? { taxId: buyerTaxId } : {}),
        },
      })
    }

    // Get price from env
    const priceCents = parseInt(process.env.PRICE_CENTS || '3990', 10)

    // Auto-fallback: bypass se API key não configurada (dev sem MOCK_MODE)
    const effectiveBypass = isBypassPayment || !process.env.ABACATEPAY_API_KEY
    if (effectiveBypass && !isBypassPayment) {
      console.warn('[Purchases] ABACATEPAY_API_KEY nao configurado — bypass automatico')
    }

    // Bypass payment: cria purchase, marca PAID e dispara processamento
    if (effectiveBypass) {
      console.log(`🧪 [BYPASS] Payment bypass - criando purchase para: ${cleanedTerm}`)

      const purchase = await prisma.purchase.create({
        data: {
          userId: user.id,
          code,
          term: cleanedTerm,
          amount: priceCents,
          status: 'PAID',
          paidAt: new Date(),
          paymentProvider: getPaymentProvider(),
          termsAcceptedAt: new Date(),
        },
      })

      console.log(`🧪 [BYPASS] Purchase criada PAID: ${purchase.code} (${getPaymentProvider()})`)

      // Tenta disparar Inngest (funciona se dev server estiver rodando)
      try {
        const { inngest } = await import('@/lib/inngest')
        await inngest.send({
          name: 'search/process',
          data: {
            purchaseId: purchase.id,
            purchaseCode: purchase.code,
            term: cleanedTerm,
            type: cleanedTerm.length === 11 ? 'CPF' : 'CNPJ',
            email: user.email,
          },
        })
        console.log(`🧪 [BYPASS] Inngest event search/process enviado para ${purchase.code}`)
      } catch (err) {
        console.warn(`🧪 [BYPASS] Inngest indisponível — fallback para processamento síncrono`, err)
        // Fallback: chamar process-search diretamente (fire-and-forget)
        const fallbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process-search/${code}`
        fetch(fallbackUrl, { method: 'POST' })
          .then(res => {
            if (res.ok) console.log(`🧪 [BYPASS] Fallback process-search OK para ${code}`)
            else console.error(`🧪 [BYPASS] Fallback process-search falhou: ${res.status}`)
          })
          .catch(fallbackErr => {
            console.error(`🧪 [BYPASS] Fallback process-search erro:`, fallbackErr)
          })
      }

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

    // Capture lead data for abandoned checkout tracking
    await prisma.leadCapture.create({
      data: {
        email: userEmail,
        name: name || null,
        phone: cellphone || null,
        buyerTaxId: buyerTaxId || null,
        term: cleanedTerm,
        reason: 'CHECKOUT_STARTED',
      },
    }).catch(err => {
      // Non-critical — don't block purchase flow
      console.warn('[Purchases] Failed to create LeadCapture:', err)
    })

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      // Pre-fill AbacatePay checkout form with buyer data (requires name + email + taxId)
      const buyerName = name || user.name
      const buyerTaxIdResolved = buyerTaxId || user.taxId
      let customerId: string | undefined
      if (buyerName && buyerTaxIdResolved) {
        const custId = await createOrGetCustomer({
          name: buyerName,
          email: userEmail,
          taxId: buyerTaxIdResolved,
          cellphone: cellphone || user.cellphone || undefined,
        })
        if (custId) customerId = custId
      }

      const { sessionId, checkoutUrl } = await createCheckout({
        externalRef: code,
        successUrl: `${appUrl}/compra/confirmacao?code=${code}`,
        cancelUrl: `${appUrl}/`,
        ...(customerId ? { customerId } : {}),
      })

      console.log(`[${provider}] Checkout session created:`, { code, sessionId })

      // Save billingId for webhook lookup
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { paymentExternalId: sessionId },
      })

      // Disparar funil de abandono apenas em live mode (pagamento real)
      // Não disparar para guest users (não têm conta para acompanhar)
      if (!userEmail.includes('@guest.eopix.app')) {
        inngest.send({
          name: 'purchase/created',
          data: {
            purchaseId: purchase.id,
            email: userEmail,
            name: user.name || '',
            term: cleanedTerm,
          },
        }).catch(err => {
          console.warn('[Purchases] Abandonment event send failed:', err)
        })
      }

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
            searchResult: { select: { name: true } },
          },
        },
      },
    })

    if (!user) {
      if (isMockMode) {
        const { MOCK_PURCHASES } = await import('@/lib/mocks/purchases-data')
        return NextResponse.json({
          email: session.email,
          purchases: MOCK_PURCHASES,
          isAdmin: false,
        })
      }
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      )
    }

    // Map purchases with additional info
    const purchases: Array<{
      id: string
      code: string
      status: string
      processingStep: number
      type: string
      term: string
      createdAt: Date | string
      hasReport: boolean
      reportId: string | null
      reportName: string | null
    }> = user.purchases.map((p) => ({
      id: p.id,
      code: p.code,
      status: p.status,
      processingStep: p.processingStep,
      type: p.term.length === 11 ? 'CPF' : 'CNPJ',
      term: formatDocument(p.term),
      createdAt: p.createdAt,
      hasReport: !!p.searchResultId,
      reportId: p.searchResultId,
      reportName: p.searchResult?.name || null,
    }))

    // In MOCK_MODE, prepend mock purchases for UI showcase
    if (isMockMode) {
      const { MOCK_PURCHASES } = await import('@/lib/mocks/purchases-data')
      purchases.unshift(...MOCK_PURCHASES)
    }

    const isAdmin = await isAdminEmail(session.email)

    return NextResponse.json({
      email: session.email,
      purchases,
      isAdmin,
    })
  } catch (error) {
    console.error('List purchases error:', error)
    return NextResponse.json(
      { error: 'Erro ao listar compras' },
      { status: 500 }
    )
  }
}
