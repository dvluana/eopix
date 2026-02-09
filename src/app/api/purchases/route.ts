import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPixCharge } from '@/lib/asaas'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidCPF, isValidCNPJ, isValidEmail, cleanDocument } from '@/lib/validators'
import { inngest } from '@/lib/inngest'

// TEST_MODE: Bypass do Asaas - cria purchase já paga e dispara processamento
// TODO: Remover TEST_MODE=true quando Asaas estiver configurado em produção
const TEST_MODE = process.env.TEST_MODE === 'true'

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

    // Check rate limit (bypass in TEST_MODE)
    if (!TEST_MODE) {
      const rateLimit = await checkRateLimit(email, 'purchase')
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

    // TEST_MODE: Bypass Asaas - cria purchase já paga
    // Nota: Em TEST_MODE sem Inngest configurado, o processamento é feito via endpoint separado
    if (TEST_MODE) {
      console.log(`🧪 [TEST_MODE] Bypass Asaas - criando purchase PAID para: ${cleanedTerm}`)

      // Cria purchase já com status PAID (mas ainda PROCESSING para indicar que precisa processar)
      const purchase = await prisma.purchase.create({
        data: {
          userId: user.id,
          code,
          term: cleanedTerm,
          amount: priceCents,
          status: 'PAID',
          paidAt: new Date(),
          termsAcceptedAt: new Date(),
        },
      })

      // Tenta disparar Inngest se configurado, senão apenas loga
      const hasInngestKey = !!process.env.INNGEST_EVENT_KEY
      if (hasInngestKey) {
        try {
          await inngest.send({
            name: 'search/process',
            data: {
              purchaseId: purchase.id,
              purchaseCode: purchase.code,
              term: cleanedTerm,
              type: isCpf ? 'CPF' : 'CNPJ',
              email: email.toLowerCase(),
            },
          })
          console.log(`🧪 [TEST_MODE] Inngest job disparado para purchase: ${purchase.code}`)
        } catch {
          console.log(`🧪 [TEST_MODE] Inngest não disponível, purchase criada: ${purchase.code}`)
          console.log(`🧪 [TEST_MODE] Para processar manualmente, use: POST /api/process-search/${purchase.id}`)
        }
      } else {
        console.log(`🧪 [TEST_MODE] Inngest não configurado, purchase criada: ${purchase.code}`)
        console.log(`🧪 [TEST_MODE] Para processar, configure INNGEST_EVENT_KEY ou use processamento manual`)
      }

      // Retorna URL de confirmação direto (sem checkout Asaas)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.json({
        code: purchase.code,
        checkoutUrl: `${appUrl}/compra/confirmacao?code=${purchase.code}`,
        _testMode: true,
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

    // Create Asaas checkout
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
