import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { inngest } from '@/lib/inngest'

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const failed = await prisma.purchase.findMany({
      where: {
        status: 'FAILED',
        searchResultId: null,
      },
      include: { user: true },
    })

    if (failed.length === 0) {
      return NextResponse.json({ processed: 0, total: 0, message: 'Nenhuma compra FAILED encontrada' })
    }

    let processed = 0
    const errors: string[] = []

    for (const purchase of failed) {
      try {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: 'PROCESSING', processingStep: 1 },
        })

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

        processed++
      } catch (err) {
        errors.push(`${purchase.code}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    return NextResponse.json({
      processed,
      total: failed.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Batch process error:', error)
    return NextResponse.json(
      { error: 'Erro ao reprocessar compras' },
      { status: 500 }
    )
  }
}
