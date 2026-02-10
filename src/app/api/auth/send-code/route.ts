import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { prisma } from '@/lib/prisma'
import { sendMagicCode } from '@/lib/resend'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidEmail } from '@/lib/validators'
import { generateMagicCode } from '@/lib/auth'

// TEST_MODE: Loga código no console em vez de enviar email
// TODO: Remover TEST_MODE=true quando Resend estiver configurado em produção
const TEST_MODE = process.env.TEST_MODE === 'true'

interface SendCodeRequest {
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendCodeRequest
    const { email } = body

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalido' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check rate limit by email
    const rateLimit = await checkRateLimit(normalizedEmail, 'magic-code')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Limite de tentativas excedido. Tente novamente mais tarde.',
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      )
    }

    // Check rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const ipRateLimit = await checkRateLimit(ip, 'magic-link')
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Muitas tentativas deste IP. Tente novamente mais tarde.',
          retryAfter: Math.ceil((ipRateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      )
    }

    // Check if user has any purchases (optional: only allow login for users with purchases)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        purchases: {
          take: 1,
        },
      },
    })

    // Even if user doesn't exist, pretend success (security: don't leak email existence)
    // But don't actually send email if no purchases
    if (!user || user.purchases.length === 0) {
      // Log for debugging but return success
      console.log(`Magic code requested for unknown/empty user: ${normalizedEmail}`)
      return NextResponse.json({
        success: true,
        message: 'Se este email tiver compras associadas, voce recebera um codigo.',
      })
    }

    // Generate 6-digit code
    const code = generateMagicCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Invalidate previous unused codes
    await prisma.magicCode.updateMany({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    })

    // Create new magic code
    await prisma.magicCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
      },
    })

    // TEST_MODE: Loga código no console, não envia email
    if (TEST_MODE) {
      console.log(`🧪 [TEST_MODE] Código de acesso para ${normalizedEmail}: ${code}`)
      console.log(`🧪 [TEST_MODE] Ou use o código fixo: 123456`)
      return NextResponse.json({
        success: true,
        message: 'Codigo enviado para seu email.',
        // Em TEST_MODE, retorna hint para usar código fixo
        _testHint: 'Use o código 123456 para login em modo de teste',
      })
    }

    // Fluxo normal: envia email via Resend
    console.log('[Send-Code] Sending email to:', normalizedEmail)
    try {
      await sendMagicCode(normalizedEmail, code)
      console.log('[Send-Code] Email sent successfully')
    } catch (emailError) {
      console.error('[Send-Code] Email failed:', emailError)
      Sentry.captureException(emailError, {
        tags: { service: 'resend', operation: 'send-magic-code' },
        extra: { email: normalizedEmail },
      })
      throw emailError
    }

    return NextResponse.json({
      success: true,
      message: 'Codigo enviado para seu email.',
    })
  } catch (error) {
    console.error('[Send-Code] Error:', error)
    Sentry.captureException(error, {
      tags: { service: 'auth', operation: 'send-code' },
    })
    return NextResponse.json(
      { error: 'Erro ao enviar codigo' },
      { status: 500 }
    )
  }
}
