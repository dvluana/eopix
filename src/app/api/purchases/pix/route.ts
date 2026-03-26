import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createPixCharge } from '@/lib/abacatepay'
import { getSessionWithUser } from '@/lib/auth'

const schema = z.object({
  purchaseId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionWithUser()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'purchaseId is required' }, { status: 400 })
    }

    const { purchaseId } = parsed.data

    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, userId: session.userId },
      include: { user: true },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    if (purchase.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Purchase is not PENDING (current: ${purchase.status})` },
        { status: 400 }
      )
    }

    // Reuse existing PIX charge if already created (avoids double creation on refresh)
    if (purchase.paymentExternalId?.startsWith('pix_') && purchase.pixBrCode) {
      return NextResponse.json({
        pixId: purchase.paymentExternalId,
        brCode: purchase.pixBrCode,
        brCodeBase64: purchase.pixBrCodeBase64,
        expiresAt: purchase.pixExpiresAt?.toISOString() ?? null,
      })
    }

    const result = await createPixCharge({
      purchaseCode: purchase.code,
      amount: purchase.amount,
      customer: {
        name: purchase.user.name || 'Cliente EOPIX',
        email: purchase.user.email,
        taxId: purchase.user.taxId || purchase.buyerCpfCnpj || purchase.term,
        cellphone: purchase.user.cellphone || '',
      },
    })

    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        paymentExternalId: result.pixId,
        pixBrCode: result.brCode,
        pixBrCodeBase64: result.brCodeBase64,
        pixExpiresAt: new Date(result.expiresAt),
      },
    })

    return NextResponse.json({
      pixId: result.pixId,
      brCode: result.brCode,
      brCodeBase64: result.brCodeBase64,
      expiresAt: result.expiresAt,
    })
  } catch (error) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
