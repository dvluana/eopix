import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials } from '@/lib/admin-auth'
import { createSession } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')
})

export async function POST(request: NextRequest) {
  try {
    // Validar payload
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Verificar credenciais
    const valid = await verifyAdminCredentials(email, password)

    if (!valid) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Criar sessão (mesmo cookie JWT usado pelo sistema atual)
    await createSession(email)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[Admin Login] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
