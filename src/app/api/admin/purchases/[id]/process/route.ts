import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { inngest } from '@/lib/inngest'

const TEST_MODE = process.env.TEST_MODE === 'true'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID da compra obrigatorio' },
        { status: 400 }
      )
    }

    // Find purchase with user
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra nao encontrada' },
        { status: 404 }
      )
    }

    // Only allow processing PAID purchases without report
    if (purchase.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Apenas compras pagas podem ser processadas' },
        { status: 400 }
      )
    }

    if (purchase.searchResultId) {
      return NextResponse.json(
        { error: 'Esta compra ja possui relatorio' },
        { status: 400 }
      )
    }

    // Update to PROCESSING before dispatching
    await prisma.purchase.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        processingStep: 1,
      },
    })

    // Trigger Inngest job with fallback for TEST_MODE
    let inngestDispatched = false
    try {
      await inngest.send({
        name: 'search/process',
        data: {
          purchaseId: purchase.id,
          purchaseCode: purchase.code,
          term: purchase.term,
          type: purchase.term.length === 11 ? 'CPF' : 'CNPJ',
          email: purchase.user.email,
        },
      })
      console.log(`Inngest job triggered for purchase ${purchase.code} (manual process)`)
      inngestDispatched = true
    } catch (err) {
      console.error('Failed to trigger Inngest job:', err)

      // In TEST_MODE, use sync fallback instead of failing
      if (TEST_MODE) {
        console.log(`🧪 [TEST_MODE] Inngest indisponível, usando fallback síncrono`)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        fetch(`${appUrl}/api/process-search/${purchase.code}`, { method: 'POST' })
          .then(() => console.log(`🧪 [TEST_MODE] Processamento síncrono concluído: ${purchase.code}`))
          .catch(fallbackErr => console.error(`🧪 [TEST_MODE] Fallback falhou:`, fallbackErr))
        inngestDispatched = true // Consider it dispatched (via fallback)
      } else {
        // Rollback status if Inngest fails in production
        await prisma.purchase.update({
          where: { id },
          data: {
            status: 'PAID',
            processingStep: 0,
          },
        })
        return NextResponse.json(
          { error: 'Falha ao iniciar processamento. Tente novamente.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Processamento iniciado',
    })
  } catch (error) {
    console.error('Process purchase error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar compra' },
      { status: 500 }
    )
  }
}
