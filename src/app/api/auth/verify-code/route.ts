import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, isAdminEmail } from '@/lib/auth'
import { isValidEmail } from '@/lib/validators'

// TEST_MODE: Permite código fixo 123456 para testes sem Resend configurado
// TODO: Remover TEST_MODE=true quando Resend estiver configurado em produção
const TEST_MODE = process.env.TEST_MODE === 'true'
const FIXED_TEST_CODE = '123456'

interface VerifyCodeRequest {
  email: string
  code: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VerifyCodeRequest
    const { email, code } = body

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalido' },
        { status: 400 }
      )
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Codigo invalido' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // TEST_MODE: Aceita código fixo 123456 para bypass de validação
    if (TEST_MODE && code.trim() === FIXED_TEST_CODE) {
      console.log(`🧪 [TEST_MODE] Código fixo ${FIXED_TEST_CODE} aceito para: ${normalizedEmail}`)

      // Verifica se usuário tem compras (mesma lógica do fluxo normal)
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { purchases: { take: 1 } },
      })

      if (!user || user.purchases.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma compra encontrada para este email' },
          { status: 400 }
        )
      }

      // Cria sessão normalmente
      await createSession(normalizedEmail)
      const isAdmin = isAdminEmail(normalizedEmail)

      return NextResponse.json({
        success: true,
        isAdmin,
        redirect: isAdmin ? '/admin' : '/minhas-consultas',
      })
    }

    // Fluxo normal: busca código no banco
    const magicCode = await prisma.magicCode.findFirst({
      where: {
        email: normalizedEmail,
        code: code.trim(),
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!magicCode) {
      return NextResponse.json(
        { error: 'Codigo invalido ou expirado' },
        { status: 400 }
      )
    }

    // Mark code as used
    await prisma.magicCode.update({
      where: { id: magicCode.id },
      data: { used: true },
    })

    // Create session
    await createSession(normalizedEmail)

    // Check if admin
    const isAdmin = isAdminEmail(normalizedEmail)

    return NextResponse.json({
      success: true,
      isAdmin,
      redirect: isAdmin ? '/admin' : '/minhas-consultas',
    })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar codigo' },
      { status: 500 }
    )
  }
}
