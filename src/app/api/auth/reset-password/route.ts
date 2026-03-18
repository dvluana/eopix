import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendPasswordChangedEmail } from '@/lib/email'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Dados inválidos'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { token, password } = parsed.data

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado.' },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'Este link já foi utilizado.' },
        { status: 410 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Link expirado. Solicite um novo.' },
        { status: 410 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Atomically: update password + mark token used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    // Fire-and-forget confirmation email
    sendPasswordChangedEmail(user.email, user.name || '').catch(err =>
      console.error('[ResetPassword] Confirmation email failed:', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ResetPassword] Error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
