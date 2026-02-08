import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, isAdminEmail } from '@/lib/auth'
import { isValidEmail } from '@/lib/validators'

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

    // Find valid magic code
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
