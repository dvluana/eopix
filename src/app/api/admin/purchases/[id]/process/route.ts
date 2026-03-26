import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { inngest } from '@/lib/inngest'
import { isBypassMode } from '@/lib/mock-mode'
import { validateCanProcess } from '@/lib/purchase-workflow'

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

    const validation = validateCanProcess(purchase.status, !!purchase.searchResultId)
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
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
    } catch (err) {
      console.error('Failed to trigger Inngest job:', err)

      // In bypass mode, use sync fallback instead of failing
      if (isBypassMode || process.env.INNGEST_DEV === 'true') {
        console.log(`🧪 [BYPASS] Inngest indisponível, usando fallback síncrono`)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        fetch(`${appUrl}/api/process-search/${purchase.code}`, { method: 'POST' })
          .then(() => console.log(`🧪 [BYPASS] Processamento síncrono concluído: ${purchase.code}`))
          .catch(fallbackErr => console.error(`🧪 [BYPASS] Fallback falhou:`, fallbackErr))
      } else {
        // Rollback status if Inngest fails in production
        await prisma.purchase.update({
          where: { id },
          data: {
            status: 'PAID',
            processingStep: 0,
          },
        })
        // Capture infra error to Sentry with purchase_code for admin lookup
        Sentry.withScope((scope) => {
          scope.setTag('error_category', 'infra')
          scope.setTag('infra_type', 'inngest_unreachable')
          scope.setTag('purchase_code', purchase.code)
          scope.setExtra('detail', err instanceof Error ? err.message : String(err))
          Sentry.captureException(err instanceof Error ? err : new Error(String(err)))
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
