import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

interface AutoLoginRequest {
  code: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AutoLoginRequest
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Codigo invalido' }, { status: 400 })
    }

    // Buscar compra pelo código
    const purchase = await prisma.purchase.findUnique({
      where: { code: code.toUpperCase() },
      include: { user: true },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Compra nao encontrada' }, { status: 404 })
    }

    // Só permite auto-login se pagamento confirmado
    const allowedStatuses = ['PAID', 'COMPLETED', 'PROCESSING']
    if (!allowedStatuses.includes(purchase.status)) {
      return NextResponse.json({
        success: false,
        reason: 'payment_pending',
        status: purchase.status,
      })
    }

    // Criar sessão para o email da compra
    await createSession(purchase.user.email)

    console.log('[Auto-Login] Session created for:', purchase.user.email)

    return NextResponse.json({
      success: true,
      email: purchase.user.email,
      status: purchase.status,
    })
  } catch (error) {
    console.error('[Auto-Login] Error:', error)
    Sentry.captureException(error, {
      tags: { service: 'auth', operation: 'auto-login' },
    })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
