import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Dados invalidos'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { name, email, password } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists with a password (already registered)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser?.passwordHash) {
      return NextResponse.json(
        { error: 'Email ja cadastrado. Faca login.' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    if (existingUser) {
      // User exists as guest (auto-login created) — upgrade to full account
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { name, passwordHash },
      })
    } else {
      await prisma.user.create({
        data: { email: normalizedEmail, name, passwordHash },
      })
    }

    await createSession(normalizedEmail)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Register] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
