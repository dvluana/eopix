import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPixStatus } from '@/lib/abacatepay'
import { getSessionWithUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithUser()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const purchaseId = request.nextUrl.searchParams.get('purchaseId')
    if (!purchaseId) {
      return NextResponse.json({ error: 'purchaseId is required' }, { status: 400 })
    }

    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, userId: session.userId },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    // For terminal states, return DB status directly without calling AbacatePay
    if (purchase.status === 'COMPLETED' || purchase.status === 'FAILED') {
      return NextResponse.json({ status: purchase.status, expiresAt: null })
    }

    // For PENDING with a PIX charge id, poll AbacatePay for live status
    if (purchase.paymentExternalId?.startsWith('pix_')) {
      const pixStatus = await checkPixStatus(purchase.paymentExternalId)
      return NextResponse.json({ status: pixStatus.status, expiresAt: pixStatus.expiresAt })
    }

    return NextResponse.json({ status: purchase.status, expiresAt: null })
  } catch (error) {
    console.error('[PIX Status] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
