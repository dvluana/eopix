import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    // Always 200 — never reveal if email exists or not
    if (!parsed.success) {
      return NextResponse.json({ success: true })
    }

    const email = parsed.data.email.toLowerCase().trim()

    // Rate limit per email (absorb silently — still 200)
    const rl = await checkRateLimit(email, 'password-reset')
    if (!rl.allowed) {
      return NextResponse.json({ success: true })
    }

    // Only proceed if user exists and has a password
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: true })
    }

    // Invalidate all previous active tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })

    // Create new token (1 hour expiry)
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    // Fire-and-forget email
    sendPasswordResetEmail(email, user.name || '', token).catch(err =>
      console.error('[ForgotPassword] Email failed:', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ForgotPassword] Error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
