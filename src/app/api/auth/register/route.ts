import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  name: z.string().min(2).optional(),
  cellphone: z.string().min(10).max(15).optional(),
  taxId: z.string().min(11).max(14).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Dados invalidos'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { name, email, password, cellphone, taxId: rawTaxId } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()
    const taxId = rawTaxId?.replace(/\D/g, '') || undefined

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

    // Check if taxId (CPF/CNPJ) is already used by another account
    if (taxId) {
      const cleanedTaxId = taxId.replace(/\D/g, '')
      const existingTaxIdUser = await prisma.user.findFirst({
        where: { taxId: cleanedTaxId, passwordHash: { not: null } },
      })
      if (existingTaxIdUser && existingTaxIdUser.email !== normalizedEmail) {
        return NextResponse.json(
          { error: 'CPF/CNPJ ja cadastrado em outra conta. Faca login com o email associado.' },
          { status: 409 }
        )
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    if (existingUser) {
      // User exists as guest (auto-login created) — upgrade to full account
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name || undefined,
          passwordHash,
          ...(cellphone ? { cellphone } : {}),
          ...(taxId ? { taxId } : {}),
        },
      })
    } else {
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || null,
          passwordHash,
          ...(cellphone ? { cellphone } : {}),
          ...(taxId ? { taxId } : {}),
        },
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
